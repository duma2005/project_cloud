import { NextResponse } from 'next/server';
import { z } from 'zod';

const GenreSchema = z.object({
  name: z.string().min(1).max(50)
});

export async function PUT(req: Request, { params }: { params: { genreId: string } }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = GenreSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
  }

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/genres/${params.genreId}`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify({ name: parsed.data.name })
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to update genre';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: Request, { params }: { params: { genreId: string } }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/genres/${params.genreId}`, {
    method: 'DELETE',
    headers: { Authorization: authHeader }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to delete genre';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}
