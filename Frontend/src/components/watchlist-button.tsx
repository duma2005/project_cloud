'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { useWatchlist } from '@/hooks/use-watchlist';

type Props = {
  movieId: number;
  title: string;
};

export function WatchlistButton({ movieId, title }: Props) {
  const { user } = useAuth();
  const pathname = usePathname();
  const { add } = useWatchlist({ autoLoad: false });
  const [status, setStatus] = useState<'idle' | 'adding' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    const next = encodeURIComponent(pathname || '/');
    return (
      <Link
        href={`/login?next=${next}`}
        className="focus-ring inline-flex w-fit rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:text-text"
      >
        Sign in to save
      </Link>
    );
  }

  async function handleAdd() {
    setStatus('adding');
    setError(null);
    const result = await add({ movieId, movieTitle: title });
    if (!result.ok) {
      setStatus('error');
      setError(result.error);
      return;
    }
    setStatus('done');
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={handleAdd}
        disabled={status === 'adding'}
        className="focus-ring rounded-full bg-accent px-4 py-2 text-sm font-medium text-black disabled:opacity-50"
      >
        {status === 'adding' ? 'Saving...' : status === 'done' ? 'Saved' : 'Add to watchlist'}
      </button>
      {error ? <span className="text-sm text-red-300">{error}</span> : null}
    </div>
  );
}
