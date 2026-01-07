import { NextResponse } from 'next/server';

// Reserved for future catalog refresh hooks.
export async function POST() {
  return NextResponse.json({ ok: true, refreshedCount: 0, refreshed: [] });
}
