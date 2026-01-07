'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { movieRoute, searchRoute, toAppHref } from '@/lib/routes';

type SearchResult = { tmdbId: number; title: string; year: string | null; posterUrl: string | null };

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function SearchBar({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const debounced = useDebouncedValue(q, 250);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const query = debounced.trim();
    if (query.length < 2) {
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    fetch(`/api/search?q=${encodeURIComponent(query)}&limit=8`, { signal: ac.signal })
      .then((r) => r.json())
      .then((d) => setResults(d.results ?? []))
      .catch(() => {
        // ignore
      });
  }, [debounced]);

  const hasResults = results.length > 0;

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = q.trim();
    if (trimmed.length < 2) return;
    router.push(searchRoute(trimmed, 1));
    setOpen(false);
  };

  const placeholder = useMemo(() => (compact ? 'Search…' : 'Search movies…'), [compact]);

  return (
    <div className="relative">
      <form onSubmit={onSubmit} className={cn('flex gap-2', compact ? '' : 'max-w-xl')}>
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          aria-label="Search movies"
          className="focus-ring w-full rounded-md border border-border bg-bg px-3 py-2"
        />
        <button className="focus-ring rounded-md bg-accent px-4 py-2 font-medium text-black">Search</button>
      </form>

      {open && hasResults ? (
        <div className="absolute z-40 mt-2 w-full rounded-xl border border-border bg-card shadow-soft overflow-hidden">
          <ul className="max-h-[360px] overflow-auto">
            {results.map((r) => (
              <li key={r.tmdbId} className="border-b border-border last:border-0">
                <Link
                  className="block px-3 py-2 hover:bg-bg/50 focus-ring"
                  href={toAppHref(movieRoute(slugify(r.title), r.tmdbId))}
                  onClick={() => setOpen(false)}
                >
                  <div className="text-sm font-medium">{r.title}</div>
                  <div className="text-xs text-muted">{r.year ?? '—'}</div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {open && debounced.trim().length >= 2 && !hasResults ? (
        <div className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-card shadow-soft p-3 text-sm text-muted">
          No results.
        </div>
      ) : null}
    </div>
  );
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
