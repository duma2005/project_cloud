'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { toAppRoute } from '@/lib/routes';

export default function LoginPage() {
  const { user, status, login, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email is required');
      return;
    }

    setLoading(true);
    if (!password) {
      setError('Password is required');
      return;
    }

    const result = await login(trimmedEmail, password);
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    const destination = toAppRoute(next);
    router.push(destination);
  }

  if (status === 'authenticated' && user) {
    return (
      <div className="container">
        <div className="card max-w-xl p-6 space-y-4">
          <div className="text-lg font-semibold">You are signed in.</div>
          <div className="text-sm text-muted">Signed in as {user.email}</div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="focus-ring inline-flex rounded-md border border-border px-4 py-2 text-sm"
            >
              Go home
            </Link>
            <button
              type="button"
              onClick={logout}
              className="focus-ring inline-flex rounded-md bg-accent px-4 py-2 text-sm font-medium text-black"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card max-w-xl p-6 space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Sign in</h1>
          <p className="text-sm text-muted">Sign in with your email and password.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="space-y-1 block">
            <div className="text-sm text-muted">Email</div>
            <input
              type="text"
              inputMode="email"
              autoComplete="email"
              className="focus-ring w-full rounded-md border border-border bg-bg px-3 py-2"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label className="space-y-1 block">
            <div className="text-sm text-muted">Password</div>
            <input
              type="password"
              className="focus-ring w-full rounded-md border border-border bg-bg px-3 py-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            className="focus-ring rounded-md bg-accent px-4 py-2 font-medium text-black disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {error ? <div className="text-sm text-red-300">{error}</div> : null}
        </form>

        <div className="text-sm text-muted">
          No account yet?{' '}
          <Link href="/register" className="text-accent hover:underline">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
}
