import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const RatingSchema = z.object({
  movieId: z.coerce.number().int(),
  rating: z.coerce.number().min(0).max(5)
});

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const rl = rateLimit({ key: `ratings:add:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = RatingSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
  }

  const payload = {
    movie_id: parsed.data.movieId,
    rating: parsed.data.rating
  };

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/ratings/`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify(payload)
  });

  const data = (await res.json().catch(() => ({}))) as {
    movie_id?: number;
    average?: number;
    count?: number;
    user_rating?: number | null;
    error?: string;
  };

  if (!res.ok) {
    const error = data?.error || 'Failed to save rating';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json({
    movieId: data.movie_id ?? parsed.data.movieId,
    average: data.average ?? 0,
    count: data.count ?? 0,
    userRating: data.user_rating ?? null
  });
}
