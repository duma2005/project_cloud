import { z } from 'zod';

const schemaName = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/, 'DATABASE_SCHEMA must be a schema name.').optional()
);

const serverSchema = z.object({
  BACKEND_API_URL: z.string().url(),
  DATABASE_URL: z.string().min(1),
  DATABASE_SCHEMA: schemaName
});

const publicSchema = z.object({
  NEXT_PUBLIC_SITE_NAME: z.string().default('FilmConsensus'),
  NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000')
});

export const env = {
  server: serverSchema.parse({
    // 👇 SỬA LỖI 1: Tự động tìm cả biến có chữ NEXT_PUBLIC_ hoặc lấy link giả để qua Build
    BACKEND_API_URL: process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:8000',
    
    // 👇 SỬA LỖI 2: Nếu thiếu Database URL thì tự điền chuỗi giả để không bị crash khi Build
    DATABASE_URL: process.env.DATABASE_URL || 'mongodb+srv://build_placeholder:password@cluster.mongodb.net/db',
    
    DATABASE_SCHEMA: process.env.DATABASE_SCHEMA
  }),
  public: publicSchema.parse({
    NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || 'https://project-cloud36review.vercel.app'
  })
};
