import { NextResponse } from 'next/server';
import { z } from 'zod';

const MovieUpdateSchema = z.object({
  title: z.string().min(1).max(255).optional().nullable(),
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

export async function GET(req: Request, { params }: { params: { movieId: string } }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const detailRes = await fetch(`${backendBase}/movies/${params.movieId}`, {
    method: 'GET',
    headers: { Authorization: authHeader }
  });
  const detail = await detailRes.json().catch(() => ({}));
  if (!detailRes.ok) {
    const error = detail?.detail || detail?.error || 'Failed to load movie';
    return NextResponse.json({ error }, { status: detailRes.status });
  }

  const genresRes = await fetch(`${backendBase}/movies/${params.movieId}/genres`, {
    method: 'GET',
    headers: { Authorization: authHeader }
  });
  const genres = await genresRes.json().catch(() => []);
  if (!genresRes.ok) {
    const error = genres?.detail || genres?.error || 'Failed to load genres';
    return NextResponse.json({ error }, { status: genresRes.status });
  }

  return NextResponse.json(
    {
      ...detail,
      genres: Array.isArray(genres) ? genres.map((g) => g.name) : detail.genres ?? []
    },
    { status: detailRes.status }
  );
}

export async function PUT(req: Request, { params }: { params: { movieId: string } }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = MovieUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
  }

  const payload = {
    title: parsed.data.title ?? undefined,
    original_title: parsed.data.originalTitle ?? undefined,
    release_date: parsed.data.releaseDate ?? undefined,
    duration_minutes: parsed.data.durationMinutes ?? undefined,
    age_rating: parsed.data.ageRating ?? undefined,
    description: parsed.data.description ?? undefined,
    storyline: parsed.data.storyline ?? undefined,
    imdb_score: parsed.data.imdbScore ?? undefined,
    imdb_vote_count: parsed.data.imdbVoteCount ?? undefined,
    poster_url: parsed.data.posterUrl ?? undefined,
    cover_url: parsed.data.coverUrl ?? undefined,
    trailer_url: parsed.data.trailerUrl ?? undefined,
    genres: parsed.data.genres ?? undefined
  };

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/movies/${params.movieId}`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to update movie';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: Request, { params }: { params: { movieId: string } }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/movies/${params.movieId}`, {
    method: 'DELETE',
    headers: {
      Authorization: authHeader
    }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to delete movie';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}
