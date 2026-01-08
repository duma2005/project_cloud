'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/components/auth-provider';

const GENERAL_ERROR = "Sorry, I'm having trouble right now.";

type RatingSummary = {
  movieId: number;
  average: number;
  count: number;
  userRating: number | null;
};

const STAR_PATH =
  'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z';

function formatStars(value: number) {
  if (!Number.isFinite(value)) return '0';
  return value % 1 === 0 ? value.toFixed(0) : value.toFixed(1);
}

function StarIcon({ fill, size = 20 }: { fill: number; size?: number }) {
  const clamped = Math.min(1, Math.max(0, fill));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 h-full w-full text-border"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      >
        <path d={STAR_PATH} />
      </svg>
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${clamped * 100}%` }}>
        <svg viewBox="0 0 24 24" className="h-full w-full text-accent" fill="currentColor">
          <path d={STAR_PATH} />
        </svg>
      </div>
    </div>
  );
}

function StarRow({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, index) => {
        const fill = Math.min(Math.max(value - index, 0), 1);
        return <StarIcon key={index} fill={fill} size={size} />;
      })}
    </div>
  );
}

function StarInput({
  value,
  onChange,
  disabled
}: {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center gap-1" role="radiogroup" aria-label="Rate this movie">
      {Array.from({ length: 5 }).map((_, index) => {
        const starValue = index + 1;
        const fill = Math.min(Math.max(value - index, 0), 1);
        return (
          <div key={starValue} className="relative">
            <StarIcon fill={fill} size={22} />
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(starValue - 0.5)}
              className="absolute inset-y-0 left-0 w-1/2"
              aria-label={`Rate ${starValue - 0.5} stars`}
            />
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(starValue)}
              className="absolute inset-y-0 right-0 w-1/2"
              aria-label={`Rate ${starValue} stars`}
            />
          </div>
        );
      })}
    </div>
  );
}

export function RatingPanel({ movieId }: { movieId: number }) {
  const { user } = useAuth();
  const token = user?.token;

  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!token) {
      setSummary(null);
      setStatus('idle');
      setError(null);
      return;
    }

    let active = true;
    setStatus('loading');
    setError(null);

    fetch(`/api/ratings/${movieId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => ({}))) as {
          movieId?: number;
          average?: number;
          count?: number;
          userRating?: number | null;
          error?: string;
        };
        if (!res.ok) {
          throw new Error(data?.error || 'Failed to load ratings');
        }
        return data;
      })
      .then((data) => {
        if (!active) return;
        const nextSummary: RatingSummary = {
          movieId: data.movieId ?? movieId,
          average: Number(data.average ?? 0),
          count: Number(data.count ?? 0),
          userRating: data.userRating ?? null
        };
        setSummary(nextSummary);
        setValue(nextSummary.userRating ?? 0);
        setStatus('idle');
      })
      .catch((err) => {
        if (!active) return;
        setStatus('error');
        setError(err?.message || 'Failed to load ratings');
      });

    return () => {
      active = false;
    };
  }, [movieId, token]);

  const canSave = useMemo(() => {
    if (!token || !summary || status === 'saving') return false;
    return summary.userRating !== value;
  }, [summary, status, token, value]);

  const handleSave = async () => {
    if (!token || status === 'saving') return;
    setStatus('saving');
    setError(null);

    try {
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ movieId, rating: value })
      });

      const data = (await res.json().catch(() => ({}))) as {
        movieId?: number;
        average?: number;
        count?: number;
        userRating?: number | null;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to save rating');
      }

      const nextSummary: RatingSummary = {
        movieId: data.movieId ?? movieId,
        average: Number(data.average ?? 0),
        count: Number(data.count ?? 0),
        userRating: data.userRating ?? value
      };
      setSummary(nextSummary);
      setValue(nextSummary.userRating ?? value);
      setStatus('idle');
    } catch (err) {
      setStatus('error');
      setError((err as any).message || GENERAL_ERROR);
    }
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">Your rating</div>
        {summary ? (
          <div className="flex items-center gap-2 text-xs text-muted">
            <StarRow value={summary.average} size={14} />
            <span>
              Avg {formatStars(summary.average)}/5 · {summary.count} ratings
            </span>
          </div>
        ) : null}
      </div>

      {!token ? (
        <div className="text-xs text-muted">Sign in to rate this movie.</div>
      ) : summary ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <StarInput value={value} onChange={setValue} disabled={status === 'saving'} />
            <div className="text-sm font-semibold min-w-[52px] text-right">
              {formatStars(value)}/5
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!canSave}
              onClick={handleSave}
              className="focus-ring rounded-md bg-accent px-3 py-2 text-sm font-medium text-black disabled:opacity-50"
            >
              {status === 'saving' ? 'Saving...' : 'Save rating'}
            </button>
            <button
              type="button"
              disabled={status === 'saving' || value === 0}
              onClick={() => setValue(0)}
              className="text-xs text-muted transition hover:text-text disabled:opacity-50"
            >
              Clear
            </button>
            {summary.userRating != null ? (
              <div className="text-xs text-muted">Your last rating: {formatStars(summary.userRating)}/5</div>
            ) : (
              <div className="text-xs text-muted">No rating yet.</div>
            )}
          </div>
        </div>
      ) : status === 'loading' ? (
        <div className="text-xs text-muted">Loading ratings...</div>
      ) : null}

      {error ? <div className="text-xs text-red-300">{error}</div> : null}
    </div>
  );
}
