import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';
import { getDatabaseUrl, getProjectRoot, loadEnvFromFile } from '../scripts/db/env.js';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = getProjectRoot();
const defaultDataPath = path.join(scriptDir, 'seed-data.json');

function resolveSeedDataPath() {
  loadEnvFromFile();
  const override = process.env.SEED_DATA_PATH;
  if (!override) return defaultDataPath;
  return path.isAbsolute(override) ? override : path.join(projectRoot, override);
}

function normalizeNameList(entries, fieldName) {
  if (!Array.isArray(entries)) return [];
  return entries
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object' && typeof entry[fieldName] === 'string') {
        return entry[fieldName];
      }
      return null;
    })
    .filter(Boolean);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function readSeedData() {
  const raw = await fsPromises.readFile(resolveSeedDataPath(), 'utf8');
  return JSON.parse(raw);
}

async function cleanup(prisma) {
  await prisma.favorite.deleteMany();
  await prisma.movieCast.deleteMany();
  await prisma.movieGenre.deleteMany();
  await prisma.person.deleteMany();
  await prisma.genre.deleteMany();
  await prisma.movie.deleteMany();
  await prisma.user.deleteMany();
}

async function seed(prisma) {
  const data = await readSeedData();

  const genreNames = normalizeNameList(data.genres, 'name');
  const personNames = normalizeNameList(data.persons, 'fullName');
  const movies = Array.isArray(data.movies) ? data.movies : [];
  const movieGenres = Array.isArray(data.movieGenres) ? data.movieGenres : [];
  const movieCast = Array.isArray(data.movieCast) ? data.movieCast : [];

  const genreMap = new Map();
  for (const name of genreNames) {
    const existing = await prisma.genre.findFirst({ where: { name } });
    if (existing) {
      genreMap.set(name, existing.genreId);
      continue;
    }
    const created = await prisma.genre.create({ data: { name } });
    genreMap.set(name, created.genreId);
  }

  const personMap = new Map();
  for (const fullName of personNames) {
    const existing = await prisma.person.findFirst({ where: { fullName } });
    if (existing) {
      personMap.set(fullName, existing.personId);
      continue;
    }
    const created = await prisma.person.create({ data: { fullName } });
    personMap.set(fullName, created.personId);
  }

  const movieMap = new Map();
  for (const movie of movies) {
    if (!movie || typeof movie.title !== 'string') continue;
    const existing = await prisma.movie.findFirst({ where: { title: movie.title } });
    if (existing) {
      movieMap.set(movie.title, existing.movieId);
      continue;
    }
    const created = await prisma.movie.create({
      data: {
        title: movie.title,
        originalTitle: movie.originalTitle ?? null,
        releaseDate: parseDate(movie.releaseDate),
        durationMinutes: movie.durationMinutes ?? null,
        ageRating: movie.ageRating ?? null,
        description: movie.description ?? null,
        storyline: movie.storyline ?? null,
        imdbScore: movie.imdbScore ?? null,
        imdbVoteCount: movie.imdbVoteCount ?? null,
        posterUrl: movie.posterUrl ?? null,
        coverUrl: movie.coverUrl ?? null,
        trailerUrl: movie.trailerUrl ?? null
      }
    });
    movieMap.set(movie.title, created.movieId);
  }

  const movieGenreRows = movieGenres
    .map((entry) => {
      if (!entry || typeof entry.movieTitle !== 'string' || typeof entry.genreName !== 'string') {
        return null;
      }
      const movieId = movieMap.get(entry.movieTitle);
      const genreId = genreMap.get(entry.genreName);
      if (!movieId || !genreId) return null;
      return { movieId, genreId };
    })
    .filter(Boolean);

  if (movieGenreRows.length > 0) {
    await prisma.movieGenre.createMany({ data: movieGenreRows, skipDuplicates: true });
  }

  const allowedRoles = new Set(['Director', 'Writer', 'Actor']);
  const movieCastRows = movieCast
    .map((entry) => {
      if (
        !entry ||
        typeof entry.movieTitle !== 'string' ||
        typeof entry.personName !== 'string' ||
        typeof entry.role !== 'string'
      ) {
        return null;
      }
      if (!allowedRoles.has(entry.role)) return null;
      const movieId = movieMap.get(entry.movieTitle);
      const personId = personMap.get(entry.personName);
      if (!movieId || !personId) return null;
      return {
        movieId,
        personId,
        role: entry.role,
        characterName: entry.characterName ?? null
      };
    })
    .filter(Boolean);

  if (movieCastRows.length > 0) {
    await prisma.movieCast.createMany({ data: movieCastRows, skipDuplicates: true });
  }

  console.log(
    `Seeded ${movieMap.size} movies, ${genreMap.size} genres, ${personMap.size} persons.`
  );
}

async function validate(prisma) {
  const [movieCount, genreCount, personCount] = await prisma.$transaction([
    prisma.movie.count(),
    prisma.genre.count(),
    prisma.person.count()
  ]);

  if (movieCount === 0) {
    throw new Error('Validation failed: movies table is empty.');
  }

  console.log(
    `Validation ok: movies=${movieCount}, genres=${genreCount}, persons=${personCount}`
  );
}

async function main() {
  const command = process.argv[2] ?? 'seed';

  if (command === 'print-url') {
    console.log(getDatabaseUrl());
    return;
  }

  process.env.DATABASE_URL = getDatabaseUrl();
  const prisma = new PrismaClient();

  try {
    if (command === 'reset') {
      if (process.env.SEED_CONFIRM !== 'YES') {
        throw new Error('Set SEED_CONFIRM=YES to run reset.');
      }
      await cleanup(prisma);
      await seed(prisma);
      return;
    }

    if (command === 'cleanup') {
      if (process.env.SEED_CONFIRM !== 'YES') {
        throw new Error('Set SEED_CONFIRM=YES to run cleanup.');
      }
      await cleanup(prisma);
      return;
    }

    if (command === 'validate') {
      await validate(prisma);
      return;
    }

    if (command !== 'seed') {
      throw new Error('Usage: node prisma/seed.js [seed|reset|cleanup|validate|print-url]');
    }

    await seed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
