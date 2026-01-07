'use client';

import { AuthGate } from '@/components/auth-gate';
import { MovieGrid } from '@/components/movie-grid';
import { useWatchlist } from '@/hooks/use-watchlist';

function WatchlistContent() {
  const { items, status, error, load } = useWatchlist();

  if (status === 'loading') {
    return <div className="card p-6 text-muted">Loading...</div>;
  }

  if (status === 'error') {
    return (
      <div className="card p-6 space-y-3">
        <div className="text-sm text-red-300">{error || 'Failed to load watchlist.'}</div>
        <button
          type="button"
          className="focus-ring w-fit rounded-md bg-accent px-4 py-2 text-sm font-medium text-black"
          onClick={load}
        >
          Try again
        </button>
      </div>
    );
  }

  if (!items.length) {
    return <div className="card p-6 text-muted">No saved movies yet.</div>;
  }

  return (
    <MovieGrid
      movies={items.map((item) => ({
        tmdbId: item.movieId,
        title: item.title,
        year: item.year || 'N/A',
        posterUrl: item.posterUrl
      }))}
    />
  );
}

export default function WatchlistPage() {
  return (
    <div className="container space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Watchlist</h1>
        <p className="text-sm text-muted">Movies you saved for later.</p>
      </div>
      <AuthGate>
        <WatchlistContent />
      </AuthGate>
    </div>
  );
}
