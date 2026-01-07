import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';
import { backendUrl } from '@/lib/backend';

const EmailSchema = z
  .string()
  .min(1)
  .max(100)
  .refine((value) => value === 'admin@a' || z.string().email().safeParse(value).success, {
    message: 'Invalid email'
  });

const RegisterSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6).max(128),
  full_name: z.string().min(1).max(100).optional()
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const rl = rateLimit({ key: `auth:register:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
  }

  const res = await fetch(backendUrl('/auth/register'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(parsed.data)
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Registration failed';
    return NextResponse.json({ error }, { status: res.status });
  }
  return NextResponse.json(data, { status: res.status });
}
