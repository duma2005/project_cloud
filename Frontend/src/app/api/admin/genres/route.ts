import { NextResponse } from 'next/server';
import { z } from 'zod';

const GenreSchema = z.object({
  name: z.string().min(1).max(50)
});

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();
  const query = searchParams.get('query');
  if (query) params.set('query', query);

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/genres?${params.toString()}`, {
    method: 'GET',
    headers: { Authorization: authHeader }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to load genres';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = GenreSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
  }

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/genres`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify({ name: parsed.data.name })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to create genre';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}
