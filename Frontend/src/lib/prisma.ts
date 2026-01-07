import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

function withSchema(databaseUrl: string, schema?: string) {
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

if (process.env.DATABASE_URL && process.env.DATABASE_SCHEMA) {
  process.env.DATABASE_URL = withSchema(process.env.DATABASE_URL, process.env.DATABASE_SCHEMA);
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
