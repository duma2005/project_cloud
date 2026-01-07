import { NextResponse } from 'next/server';
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

const MovieSchema = z.object({
  title: z.string().min(1).max(255),
  originalTitle: z.string().max(255).optional().nullable(),
  releaseDate: z.string().optional().nullable(),
  durationMinutes: z.coerce.number().int().positive().optional().nullable(),
  ageRating: z.string().max(20).optional().nullable(),
  description: z.string().max(5000).optional().nullable(),
  storyline: z.string().max(5000).optional().nullable(),
  imdbScore: z.coerce.number().min(0).max(10).optional().nullable(),
  imdbVoteCount: z.coerce.number().int().min(0).optional().nullable(),
  posterUrl: z.string().max(500).optional().nullable(),
  coverUrl: z.string().max(500).optional().nullable(),
  trailerUrl: z.string().max(500).optional().nullable(),
  genres: z.array(z.string().max(50)).optional().nullable()
});

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();
  const query = searchParams.get('query');
  const page = searchParams.get('page');
  const limit = searchParams.get('limit');
  if (query) params.set('query', query);
  if (page) params.set('page', page);
  if (limit) params.set('limit', limit);

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/movies?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: authHeader
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to load movies';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const rl = rateLimit({ key: `admin:movies:create:${ip}`, limit: 10, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = MovieSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
  }

  const payload = {
    title: parsed.data.title,
    original_title: parsed.data.originalTitle || undefined,
    release_date: parsed.data.releaseDate || undefined,
    duration_minutes: parsed.data.durationMinutes ?? undefined,
    age_rating: parsed.data.ageRating || undefined,
    description: parsed.data.description || undefined,
    storyline: parsed.data.storyline || undefined,
    imdb_score: parsed.data.imdbScore ?? undefined,
    imdb_vote_count: parsed.data.imdbVoteCount ?? undefined,
    poster_url: parsed.data.posterUrl || undefined,
    cover_url: parsed.data.coverUrl || undefined,
    trailer_url: parsed.data.trailerUrl || undefined,
    genres: parsed.data.genres || undefined
  };

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/movies`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to create movie';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}
