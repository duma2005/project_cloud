import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

type FavoriteRow = {
  movie_id: number;
  created_at?: string;
};

type WatchlistItem = {
  movieId: number;
  title: string;
  year: string | null;
  posterUrl: string | null;
  createdAt?: string;
};

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const rl = rateLimit({ key: `watchlist:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.allowed) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/watchlist/`, {
    method: 'GET',
    headers: { Authorization: authHeader }
  });

  const data = (await res.json().catch(() => [])) as FavoriteRow[] | { error?: string };
  if (!res.ok) {
    const error = (data as { error?: string })?.error || 'Failed to load watchlist';
    return NextResponse.json({ error }, { status: res.status });
  }

  const favorites = Array.isArray(data) ? data : [];
  const movieIds = favorites.map((fav) => fav.movie_id).filter((id) => typeof id === 'number');

  const movies = movieIds.length
    ? await prisma.movie.findMany({
        where: { movieId: { in: movieIds } },
        select: { movieId: true, title: true, releaseDate: true, posterUrl: true }
      })
    : [];

  const movieMap = new Map(movies.map((movie) => [movie.movieId, movie]));
  const items: WatchlistItem[] = favorites.map((fav) => {
    const movie = movieMap.get(fav.movie_id);
    return {
      movieId: fav.movie_id,
      title: movie?.title ?? `Movie ${fav.movie_id}`,
      year: movie?.releaseDate ? String(movie.releaseDate.getUTCFullYear()) : null,
      posterUrl: movie?.posterUrl ?? null,
      createdAt: fav.created_at
    };
  });

  return NextResponse.json({ items });
}
