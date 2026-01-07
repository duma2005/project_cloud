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

const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(6).max(128)
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const rl = rateLimit({ key: `auth:${ip}`, limit: 20, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const json = await req.json().catch(() => null);
  const parsed = LoginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
  }

  const res = await fetch(backendUrl('/auth/login'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: parsed.data.email, password: parsed.data.password })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Login failed';
    return NextResponse.json({ error }, { status: res.status });
  }
  return NextResponse.json(data, { status: res.status });
}
