import fs from 'node:fs/promises';
import path from 'node:path';
import { getProjectRoot } from './env.js';

const projectRoot = getProjectRoot();
const repoRoot = path.resolve(projectRoot, '..');

function resolvePath(inputPath, baseDir) {
  if (!inputPath) return null;
  return path.isAbsolute(inputPath) ? inputPath : path.resolve(baseDir, inputPath);
}

const defaultInput = path.join(repoRoot, 'Backend', 'test4.sql');
const inputPath = resolvePath(process.env.TEST4_SQL_PATH ?? defaultInput, repoRoot);
const outputPath = resolvePath(
  process.env.TEST4_OUTPUT_PATH ?? path.join(projectRoot, 'prisma', 'seed-test4.json'),
  projectRoot
);
const deriveImdbScore = process.env.IMDB_SCORE_FROM_RANK === 'true';

function extractValuesBlock(sql, patterns, label) {
  const regexes = Array.isArray(patterns) ? patterns : [patterns];
  for (const regex of regexes) {
    const match = sql.match(regex);
    if (match) {
      return match[1];
    }
  }
  throw new Error(`Khong tim thay block cho ${label}.`);
}

function parseSqlValue(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^null$/i.test(trimmed)) return null;
  if (/^date\s+/i.test(trimmed)) {
    return trimmed.replace(/^date\s+/i, '').trim();
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed;
}

function parseTuple(tupleStr) {
  const values = [];
  let current = '';
  let inQuote = false;

  for (let i = 0; i < tupleStr.length; i += 1) {
    const ch = tupleStr[i];
    if (inQuote) {
      if (ch === "'") {
        if (tupleStr[i + 1] === "'") {
          current += "'";
          i += 1;
        } else {
          inQuote = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === "'") {
      inQuote = true;
      continue;
    }

    if (ch === ',') {
      values.push(parseSqlValue(current));
      current = '';
      continue;
    }

    current += ch;
  }

  values.push(parseSqlValue(current));
  return values;
}

function parseValuesBlock(block) {
  const tuples = [];
  let i = 0;

  while (i < block.length) {
    if (block[i] !== '(') {
      i += 1;
      continue;
    }

    const start = i + 1;
    i = start;
    let inQuote = false;

    for (; i < block.length; i += 1) {
      const ch = block[i];
      if (inQuote) {
        if (ch === "'") {
          if (block[i + 1] === "'") {
            i += 1;
          } else {
            inQuote = false;
          }
        }
        continue;
      }

      if (ch === "'") {
        inQuote = true;
        continue;
      }

      if (ch === ')') {
        break;
      }
    }

    if (i >= block.length) break;

    const tupleStr = block.slice(start, i);
    tuples.push(parseTuple(tupleStr));
    i += 1;
  }

  return tuples;
}

function parseSelectUnionBlock(block, expectedColumns) {
  const rows = block.split(/\bUNION\s+ALL\s+SELECT\b/i);
  const tuples = [];

  for (const rawRow of rows) {
    let cleaned = rawRow.replace(/\bSELECT\b/i, '').trim();
    if (!cleaned) continue;
    cleaned = cleaned.replace(/\s+AS\s+\w+/gi, '');
    const values = parseTuple(cleaned);
    while (values.length < expectedColumns) {
      values.push(null);
    }
    tuples.push(values.slice(0, expectedColumns));
  }

  return tuples;
}

function isSelectBlock(block) {
  return /\bUNION\s+ALL\s+SELECT\b/i.test(block) || /\bSELECT\b/i.test(block);
}

function toUniqueList(values) {
  const set = new Set();
  for (const value of values) {
    if (value != null && value !== '') {
      set.add(value);
    }
  }
  return Array.from(set);
}

function mapRole(job) {
  if (!job || typeof job !== 'string') return null;
  const lower = job.toLowerCase();
  if (lower === 'director') return 'Director';
  if (lower === 'writer') return 'Writer';
  if (lower === 'actor') return 'Actor';
  return null;
}

function buildSeedData(sql) {
  const moviesBlock = extractValuesBlock(sql, /INSERT INTO movies[\s\S]*?VALUES\s*([\s\S]*?);/i, 'movies');
  const genresBlock = extractValuesBlock(
    sql,
    [
      /INSERT INTO genres[\s\S]*?VALUES\s*([\s\S]*?)(?:ON CONFLICT|;)/i,
      /INSERT\s+(?:IGNORE\s+)?INTO\s+genres[\s\S]*?VALUES\s*([\s\S]*?);/i
    ],
    'genres'
  );
  const personsBlock = extractValuesBlock(
    sql,
    [
      /INSERT INTO persons[\s\S]*?VALUES\s*([\s\S]*?)(?:ON CONFLICT|;)/i,
      /INSERT\s+(?:IGNORE\s+)?INTO\s+persons[\s\S]*?VALUES\s*([\s\S]*?);/i
    ],
    'persons'
  );
  const movieGenresBlock = extractValuesBlock(
    sql,
    [
      /WITH v\(title,\s*genre\)\s+AS\s*\(\s*VALUES\s*([\s\S]*?)\)\s*INSERT INTO movie_genres/i,
      /INSERT\s+(?:IGNORE\s+)?INTO\s+movie_genres[\s\S]*?FROM\s*\(\s*([\s\S]*?)\)\s*AS\s*v\(\s*title\s*,\s*genre\s*\)/i
    ],
    'movie_genres'
  );
  const movieCastBlock = extractValuesBlock(
    sql,
    [
      /WITH v\(title,\s*person,\s*job,\s*character_name,\s*billing_order\)\s+AS\s*\(\s*VALUES\s*([\s\S]*?)\)\s*INSERT INTO movie_cast/i,
      /INSERT\s+(?:IGNORE\s+)?INTO\s+movie_cast[\s\S]*?FROM\s*\(\s*([\s\S]*?)\)\s*AS\s*v\(\s*title\s*,\s*person\s*,\s*job\s*,\s*character_name\s*,\s*billing_order\s*\)/i
    ],
    'movie_cast'
  );

  const moviesTuples = parseValuesBlock(moviesBlock);
  const genresTuples = parseValuesBlock(genresBlock);
  const personsTuples = parseValuesBlock(personsBlock);
  const movieGenresTuples = isSelectBlock(movieGenresBlock)
    ? parseSelectUnionBlock(movieGenresBlock, 2)
    : parseValuesBlock(movieGenresBlock);
  const movieCastTuples = isSelectBlock(movieCastBlock)
    ? parseSelectUnionBlock(movieCastBlock, 5)
    : parseValuesBlock(movieCastBlock);

  const movies = moviesTuples
    .map(([title, releaseDate, durationMinutes, ageRating, imdbRank]) => {
      if (!title) return null;
      const movie = {
        title,
        releaseDate: releaseDate ?? null,
        durationMinutes: durationMinutes ?? null,
        ageRating: ageRating ?? null
      };
      if (deriveImdbScore && typeof imdbRank === 'number') {
        const score = 10 - Math.max(0, imdbRank - 1) * 0.1;
        movie.imdbScore = Number(score.toFixed(1));
      }
      return movie;
    })
    .filter(Boolean);

  const genres = toUniqueList(genresTuples.map(([name]) => name));
  const persons = toUniqueList(personsTuples.map(([name]) => name));

  const movieGenres = movieGenresTuples
    .map(([movieTitle, genreName]) => {
      if (!movieTitle || !genreName) return null;
      return { movieTitle, genreName };
    })
    .filter(Boolean);

  const movieCast = movieCastTuples
    .map(([movieTitle, personName, job, characterName]) => {
      const role = mapRole(job);
      if (!movieTitle || !personName || !role) return null;
      return {
        movieTitle,
        personName,
        role,
        characterName: characterName ?? null
      };
    })
    .filter(Boolean);

  return {
    movies,
    genres,
    persons,
    movieGenres,
    movieCast
  };
}

async function main() {
  const sql = await fs.readFile(inputPath, 'utf8');
  const seedData = buildSeedData(sql);

  await fs.writeFile(outputPath, `${JSON.stringify(seedData, null, 2)}\n`);
  console.log(`Da tao file seed: ${outputPath}`);
  console.log(
    `movies=${seedData.movies.length}, genres=${seedData.genres.length}, persons=${seedData.persons.length}, movieGenres=${seedData.movieGenres.length}, movieCast=${seedData.movieCast.length}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
