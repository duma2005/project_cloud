import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, '..', '..');
const envPath = path.join(projectRoot, '.env');

export function getProjectRoot() {
  return projectRoot;
}

export function getEnvPath() {
  return envPath;
}

export function loadEnvFromFile(filePath = envPath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function ensureSchemaName(schema) {
  if (!schema) return null;
  if (schema.includes('://')) {
    throw new Error('DATABASE_SCHEMA must be a schema name, not a URL.');
  }
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(schema)) {
    throw new Error(`DATABASE_SCHEMA "${schema}" contains invalid characters.`);
  }
  return schema;
}

function withSchema(databaseUrl, schema) {
  if (!schema) return databaseUrl;
  if (!databaseUrl.startsWith('postgres://') && !databaseUrl.startsWith('postgresql://')) {
    return databaseUrl;
  }

  try {
    const url = new URL(databaseUrl);
    if (!url.searchParams.get('schema')) {
      url.searchParams.set('schema', schema);
    }
    return url.toString();
  } catch {
    return databaseUrl;
  }
}

export function getDatabaseUrl({ includeSchema = true } = {}) {
  loadEnvFromFile();
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing. Check film-consensus/.env');
  }
  const schema = ensureSchemaName(process.env.DATABASE_SCHEMA);
  return includeSchema ? withSchema(databaseUrl, schema) : databaseUrl;
}

export function getSchemaName() {
  loadEnvFromFile();
  return ensureSchemaName(process.env.DATABASE_SCHEMA);
}

export function resolvePsqlBin() {
  if (process.env.PSQL_BIN) return process.env.PSQL_BIN;
  const homebrew = '/opt/homebrew/opt/libpq/bin/psql';
  if (fs.existsSync(homebrew)) return homebrew;
  return 'psql';
}
