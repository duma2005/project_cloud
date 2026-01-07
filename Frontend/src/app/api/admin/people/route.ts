import { NextResponse } from 'next/server';
import { z } from 'zod';

const PersonSchema = z.object({
  fullName: z.string().min(1).max(100),
  birthDate: z.string().optional().nullable(),
  avatarUrl: z.string().max(500).optional().nullable(),
  bio: z.string().max(2000).optional().nullable()
});

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();
  const query = searchParams.get('query');
  if (query) params.set('query', query);

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/people?${params.toString()}`, {
    method: 'GET',
    headers: { Authorization: authHeader }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to load people';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = PersonSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
  }

  const payload = {
    full_name: parsed.data.fullName,
    birth_date: parsed.data.birthDate || undefined,
    avatar_url: parsed.data.avatarUrl || undefined,
    bio: parsed.data.bio || undefined
  };

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/people`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to create person';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}
