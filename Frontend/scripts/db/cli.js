import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { getDatabaseUrl, getProjectRoot, getSchemaName, loadEnvFromFile, resolvePsqlBin } from './env.js';

const projectRoot = getProjectRoot();
const command = process.argv[2] ?? 'help';

function run(cmd, args, options = {}) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: projectRoot,
    env: { ...process.env, ...options.env }
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function requireConfirm(action) {
  if (process.env.SEED_CONFIRM !== 'YES') {
    throw new Error(`Set SEED_CONFIRM=YES to run ${action}.`);
  }
}

function requireSchema() {
  const schema = getSchemaName();
  if (!schema) {
    throw new Error('DATABASE_SCHEMA is required for schema commands.');
  }
  return schema;
}

function runPsql(sql) {
  const psqlBin = resolvePsqlBin();
  const databaseUrl = getDatabaseUrl({ includeSchema: false });
  run(psqlBin, [databaseUrl, '-v', 'ON_ERROR_STOP=1', '-c', sql]);
}

function runSeed(subcommand, options = {}) {
  const args = ['prisma/seed.js'];
  if (subcommand) args.push(subcommand);
  run('node', args, options);
}

function resolveTest4OutputPath() {
  return path.join(projectRoot, 'prisma', 'seed-test4.json');
}

function runTest4Convert(outputPath) {
  run('node', ['scripts/db/convert-test4.js'], {
    env: { TEST4_OUTPUT_PATH: outputPath }
  });
}

function printHelp() {
  console.log(
    [
      'Usage: node scripts/db/cli.js <command>',
      '',
      'Commands:',
      '  schema:create   Create DATABASE_SCHEMA if it does not exist.',
      '  schema:drop     Drop DATABASE_SCHEMA (requires SEED_CONFIRM=YES).',
      '  schema:reset    Drop + create DATABASE_SCHEMA (requires SEED_CONFIRM=YES).',
      '  push            Run prisma db push against DATABASE_SCHEMA.',
      '  seed            Seed data from prisma/seed-data.json.',
      '  cleanup         Delete seeded data (requires SEED_CONFIRM=YES).',
      '  reset           Drop schema, push schema, seed (requires SEED_CONFIRM=YES).',
      '  validate        Validate core tables and counts.',
      '  test4:convert   Convert Backend/test4.sql into prisma/seed-test4.json.',
      '  test4:import    Convert + reset + push + seed + validate (requires SEED_CONFIRM=YES).',
      '  print-url       Print DATABASE_URL with schema param (for debugging).',
      '  help            Show this help message.'
    ].join('\n')
  );
}

loadEnvFromFile();

try {
  switch (command) {
    case 'schema:create': {
      const schema = requireSchema();
      runPsql(`CREATE SCHEMA IF NOT EXISTS ${schema};`);
      break;
    }
    case 'schema:drop': {
      requireConfirm('schema:drop');
      const schema = requireSchema();
      runPsql(`DROP SCHEMA IF EXISTS ${schema} CASCADE;`);
      break;
    }
    case 'schema:reset': {
      requireConfirm('schema:reset');
      const schema = requireSchema();
      runPsql(`DROP SCHEMA IF EXISTS ${schema} CASCADE;`);
      runPsql(`CREATE SCHEMA IF NOT EXISTS ${schema};`);
      break;
    }
    case 'push': {
      const databaseUrl = getDatabaseUrl({ includeSchema: true });
      run('npx', ['prisma', 'db', 'push', '--schema', 'prisma/schema.prisma'], {
        env: { DATABASE_URL: databaseUrl }
      });
      break;
    }
    case 'seed': {
      runSeed('seed');
      break;
    }
    case 'cleanup': {
      requireConfirm('cleanup');
      runSeed('cleanup');
      break;
    }
    case 'reset': {
      requireConfirm('reset');
      const schema = requireSchema();
      runPsql(`DROP SCHEMA IF EXISTS ${schema} CASCADE;`);
      runPsql(`CREATE SCHEMA IF NOT EXISTS ${schema};`);
      const databaseUrl = getDatabaseUrl({ includeSchema: true });
      run('npx', ['prisma', 'db', 'push', '--schema', 'prisma/schema.prisma'], {
        env: { DATABASE_URL: databaseUrl }
      });
      runSeed('seed');
      break;
    }
    case 'validate': {
      runSeed('validate');
      break;
    }
    case 'test4:convert': {
      runTest4Convert(resolveTest4OutputPath());
      break;
    }
    case 'test4:import': {
      requireConfirm('test4:import');
      const schema = requireSchema();
      const outputPath = resolveTest4OutputPath();
      runTest4Convert(outputPath);
      runPsql(`DROP SCHEMA IF EXISTS ${schema} CASCADE;`);
      runPsql(`CREATE SCHEMA IF NOT EXISTS ${schema};`);
      const databaseUrl = getDatabaseUrl({ includeSchema: true });
      run('npx', ['prisma', 'db', 'push', '--schema', 'prisma/schema.prisma'], {
        env: { DATABASE_URL: databaseUrl }
      });
      runSeed('seed', { env: { SEED_DATA_PATH: outputPath } });
      runSeed('validate', { env: { SEED_DATA_PATH: outputPath } });
      break;
    }
    case 'print-url': {
      runSeed('print-url');
      break;
    }
    case 'help':
    default:
      printHelp();
      break;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
