import { NextResponse } from 'next/server';
import { z } from 'zod';

const HomepageSchema = z.object({
  heroMovieId: z.coerce.number().int().optional().nullable(),
  heroTagline: z.string().max(255).optional().nullable(),
  topTenTitle: z.string().max(100).optional().nullable(),
  fanFavoritesTitle: z.string().max(100).optional().nullable(),
  newArrivalsTitle: z.string().max(100).optional().nullable(),
  topTenIds: z.array(z.coerce.number().int()).optional().nullable(),
  fanFavoritesIds: z.array(z.coerce.number().int()).optional().nullable(),
  newArrivalsIds: z.array(z.coerce.number().int()).optional().nullable()
});

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/homepage`, {
    method: 'GET',
    headers: { Authorization: authHeader }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to load homepage settings';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}

export async function PUT(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = HomepageSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
  }

  const payload = {
    hero_movie_id: parsed.data.heroMovieId ?? undefined,
    hero_tagline: parsed.data.heroTagline ?? undefined,
    top_ten_title: parsed.data.topTenTitle ?? undefined,
    fan_favorites_title: parsed.data.fanFavoritesTitle ?? undefined,
    new_arrivals_title: parsed.data.newArrivalsTitle ?? undefined,
    top_ten_ids: parsed.data.topTenIds ?? undefined,
    fan_favorites_ids: parsed.data.fanFavoritesIds ?? undefined,
    new_arrivals_ids: parsed.data.newArrivalsIds ?? undefined
  };

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/homepage`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to update homepage settings';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}
