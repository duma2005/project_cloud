'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth-provider';

type WatchlistItem = {
  movieId: number;
  title: string;
  year: string | null;
  posterUrl: string | null;
  createdAt?: string;
};

type WatchlistState = {
  items: WatchlistItem[];
  status: 'idle' | 'loading' | 'ready' | 'error';
  error: string | null;
  loaded: boolean;
};

type AddResult = { ok: true } | { ok: false; error: string };

type Options = { autoLoad?: boolean };

type AddPayload = { movieId: number; movieTitle?: string };

export function useWatchlist(options: Options = {}) {
  const { user } = useAuth();
  const [state, setState] = useState<WatchlistState>({
    items: [],
    status: 'idle',
    error: null,
    loaded: false
  });

  const token = user?.token;
  const autoLoad = options.autoLoad ?? true;

  const load = useCallback(async () => {
    if (!token) {
      setState((prev) => ({ ...prev, items: [], status: 'idle', error: null, loaded: false }));
      return;
    }

    setState((prev) => ({ ...prev, status: 'loading', error: null }));
    const res = await fetch('/api/watchlist', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = (await res.json().catch(() => ({}))) as { items?: WatchlistItem[]; error?: string };
    if (!res.ok) {
      setState((prev) => ({
        ...prev,
        status: 'error',
        error: data?.error || 'Failed to load watchlist',
        loaded: true
      }));
      return;
    }

    setState({ items: data.items ?? [], status: 'ready', error: null, loaded: true });
  }, [token]);

  const add = useCallback(
    async (payload: AddPayload): Promise<AddResult> => {
      if (!token) return { ok: false, error: 'Sign in required' };

      const res = await fetch('/api/watchlist/add', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        return { ok: false, error: data?.error || 'Failed to add to watchlist' };
      }

      if (state.loaded) {
        await load();
      }

      return { ok: true };
    },
    [token, state.loaded, load]
  );

  useEffect(() => {
    if (!autoLoad) return;
    load();
  }, [autoLoad, load]);

  const value = useMemo(
    () => ({
      items: state.items,
      status: state.status,
      error: state.error,
      loaded: state.loaded,
      load,
      add
    }),
    [state.items, state.status, state.error, state.loaded, load, add]
  );

  return value;
}
