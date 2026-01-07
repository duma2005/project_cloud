import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

type BackendSearchResult = {
  movie_id: number;
  title: string;
  release_date?: string | null;
  poster_url?: string | null;
};

type BackendSearchResponse = {
  results?: BackendSearchResult[];
  total_results?: number;
  page?: number;
  limit?: number;
  error?: string;
};

function parseNumber(value: string | null, fallback: number) {
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function GET(req: Request) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon';
  const rl = rateLimit({ key: `search:${ip}`, limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (q.length < 2) return NextResponse.json({ results: [] });
  const page = Math.max(1, parseNumber(searchParams.get('page'), 1));
  const limit = Math.min(50, Math.max(1, parseNumber(searchParams.get('limit'), 8)));

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const params = new URLSearchParams({ query: q, page: String(page), limit: String(limit) });
  const res = await fetch(`${backendBase}/movies/search?${params.toString()}`);
  const data = (await res.json().catch(() => null)) as BackendSearchResponse | null;

  if (!res.ok) {
    const error = data?.error || 'Search failed';
    return NextResponse.json({ error }, { status: res.status });
  }

  const results = (data?.results ?? []).map((m) => {
    const year = m.release_date ? new Date(m.release_date).getUTCFullYear() : null;
    return {
      tmdbId: m.movie_id,
      title: m.title,
      year: Number.isNaN(year) ? null : String(year),
      posterUrl: m.poster_url ?? null
    };
  });

  return NextResponse.json({
    results,
    totalResults: data?.total_results ?? results.length,
    page: data?.page ?? page,
    limit: data?.limit ?? limit
  });
}
