'use client';

import { useState } from 'react';
import { z } from 'zod';

const Schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  message: z.string().min(10).max(2000)
});

type FormState = z.infer<typeof Schema>;

export function ContactForm() {
  const [state, setState] = useState<FormState>({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'ok' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = Schema.safeParse(state);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Invalid input');
      setStatus('error');
      return;
    }

    setStatus('sending');
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(parsed.data)
    });

    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setError(j?.error ?? 'Failed to send');
      setStatus('error');
      return;
    }

    setStatus('ok');
    setState({ name: '', email: '', message: '' });
  }

  return (
    <form onSubmit={submit} className="card p-6 space-y-4 max-w-xl">
      <label className="space-y-1 block">
        <div className="text-sm text-muted">Name</div>
        <input
          className="focus-ring w-full rounded-md border border-border bg-bg px-3 py-2"
          value={state.name}
          onChange={(e) => setState((s) => ({ ...s, name: e.target.value }))}
          required
        />
      </label>

      <label className="space-y-1 block">
        <div className="text-sm text-muted">Email</div>
        <input
          type="email"
          className="focus-ring w-full rounded-md border border-border bg-bg px-3 py-2"
          value={state.email}
          onChange={(e) => setState((s) => ({ ...s, email: e.target.value }))}
          required
        />
      </label>

      <label className="space-y-1 block">
        <div className="text-sm text-muted">Message</div>
        <textarea
          className="focus-ring w-full rounded-md border border-border bg-bg px-3 py-2 min-h-[140px]"
          value={state.message}
          onChange={(e) => setState((s) => ({ ...s, message: e.target.value }))}
          required
        />
      </label>

      <button
        disabled={status === 'sending'}
        className="focus-ring rounded-md bg-accent px-4 py-2 font-medium text-black disabled:opacity-50"
      >
        {status === 'sending' ? 'Sending…' : 'Send'}
      </button>

      {status === 'ok' ? <div className="text-sm text-accent">Sent.</div> : null}
      {error ? <div className="text-sm text-red-300">{error}</div> : null}
    </form>
  );
}
