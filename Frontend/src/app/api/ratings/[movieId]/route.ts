import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export async function GET(req: Request, { params }: { params: { movieId: string } }) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const rl = rateLimit({ key: `ratings:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const movieId = Number(params.movieId);
  if (!Number.isFinite(movieId) || movieId <= 0) {
    return NextResponse.json({ error: 'Invalid movie id' }, { status: 400 });
  }

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/ratings/${movieId}`, {
    method: 'GET',
    headers: { Authorization: authHeader }
  });

  const data = (await res.json().catch(() => ({}))) as {
    movie_id?: number;
    average?: number;
    count?: number;
    user_rating?: number | null;
    error?: string;
  };

  if (!res.ok) {
    const error = data?.error || 'Failed to load rating';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json({
    movieId: data.movie_id ?? movieId,
    average: data.average ?? 0,
    count: data.count ?? 0,
    userRating: data.user_rating ?? null
  });
}
