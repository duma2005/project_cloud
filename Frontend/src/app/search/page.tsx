'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { MovieGrid, type MovieGridItem } from '@/components/movie-grid';
import { searchRoute } from '@/lib/routes';

type SearchApiResult = {
  tmdbId: number;
  title: string;
  year: string | null;
  posterUrl: string | null;
};

type SearchApiResponse = {
  results?: SearchApiResult[];
  totalResults?: number;
  page?: number;
  limit?: number;
  error?: string;
};

const PAGE_SIZE = 24;
const MIN_QUERY_LENGTH = 2;
const HISTORY_KEY = 'fc.search.history';
const HISTORY_LIMIT = 8;

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

function readHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeHistory(terms: string[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(terms));
  } catch {
    // ignore
  }
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryParam = (searchParams.get('q') || '').trim();
  const pageParam = Number(searchParams.get('page') || '1');
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const [query, setQuery] = useState(queryParam);
  const debounced = useDebouncedValue(query, 300);
  const [results, setResults] = useState<MovieGridItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setHistory(readHistory());
  }, []);

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  useEffect(() => {
    const trimmed = debounced.trim();
    if (trimmed === queryParam) return;
    if (!trimmed) {
      router.replace('/search');
      return;
    }
    router.replace(searchRoute(trimmed, 1));
  }, [debounced, queryParam, router]);

  useEffect(() => {
    const trimmed = queryParam.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setTotalResults(0);
      setError(null);
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    setLoading(true);
    setError(null);

    fetch(`/api/search?q=${encodeURIComponent(trimmed)}&page=${page}&limit=${PAGE_SIZE}`, {
      signal: ac.signal
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as SearchApiResponse | null;
        if (!res.ok) {
          throw new Error(data?.error || 'Search failed');
        }
        const items = (data?.results ?? []).map((item) => ({
          tmdbId: item.tmdbId,
          title: item.title,
          year: item.year ?? '—',
          posterUrl: item.posterUrl ?? null
        }));
        setResults(items);
        setTotalResults(data?.totalResults ?? items.length);

        setHistory((prev) => {
          const nextHistory = [trimmed, ...prev.filter((term) => term !== trimmed)].slice(0, HISTORY_LIMIT);
          writeHistory(nextHistory);
          return nextHistory;
        });
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError(err?.message || 'Search failed');
        setResults([]);
        setTotalResults(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [queryParam, page]);

  const totalPages = useMemo(() => {
    if (!totalResults) return 1;
    return Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  }, [totalResults]);

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <div className="container space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          {queryParam.length >= MIN_QUERY_LENGTH ? `Search: "${queryParam}"` : 'Search'}
        </h1>
      </div>

      {history.length > 0 ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted">Recent searches</span>
            <button
              type="button"
              onClick={() => {
                setHistory([]);
                writeHistory([]);
              }}
              className="text-accent hover:underline"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => router.push(searchRoute(term, 1))}
                className="rounded-full border border-border px-3 py-1 text-sm text-muted transition hover:text-text"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {loading ? <div className="text-sm text-muted">Searching...</div> : null}
      {error ? <div className="text-sm text-red-300">{error}</div> : null}

      {queryParam.length < MIN_QUERY_LENGTH ? (
        <div className="card p-6 text-muted">Type at least {MIN_QUERY_LENGTH} characters to search.</div>
      ) : results.length === 0 && !loading && !error ? (
        <div className="card p-6 text-muted">No results found for "{queryParam}".</div>
      ) : null}

      {results.length > 0 ? (
        <>
          <div className="text-sm text-muted">
            Showing {results.length} of {totalResults} results for "{queryParam}"
          </div>
          <MovieGrid movies={results} />
          <div className="flex items-center justify-between">
            <Link
              className={`text-accent hover:underline ${canGoPrev ? '' : 'pointer-events-none opacity-50'}`}
              href={searchRoute(queryParam, Math.max(1, page - 1))}
            >
              Prev
            </Link>
            <div className="text-sm text-muted">
              Page {page} / {totalPages}
            </div>
            <Link
              className={`text-accent hover:underline ${canGoNext ? '' : 'pointer-events-none opacity-50'}`}
              href={searchRoute(queryParam, page + 1)}
            >
              Next
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
