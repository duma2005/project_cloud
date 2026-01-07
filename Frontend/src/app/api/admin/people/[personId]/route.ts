import { NextResponse } from 'next/server';
import { z } from 'zod';

const PersonSchema = z.object({
  fullName: z.string().min(1).max(100).optional().nullable(),
  birthDate: z.string().optional().nullable(),
  avatarUrl: z.string().max(500).optional().nullable(),
  bio: z.string().max(2000).optional().nullable()
});

export async function PUT(req: Request, { params }: { params: { personId: string } }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const json = await req.json().catch(() => null);
  const parsed = PersonSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 400 });
  }

  const payload = {
    full_name: parsed.data.fullName ?? undefined,
    birth_date: parsed.data.birthDate ?? undefined,
    avatar_url: parsed.data.avatarUrl ?? undefined,
    bio: parsed.data.bio ?? undefined
  };

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/people/${params.personId}`, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      Authorization: authHeader
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to update person';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: Request, { params }: { params: { personId: string } }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Missing auth token' }, { status: 401 });

  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  const res = await fetch(`${backendBase}/people/${params.personId}`, {
    method: 'DELETE',
    headers: { Authorization: authHeader }
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = data?.detail || data?.error || 'Failed to delete person';
    return NextResponse.json({ error }, { status: res.status });
  }

  return NextResponse.json(data, { status: res.status });
}
