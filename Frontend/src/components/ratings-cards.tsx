import type { Movie } from '@prisma/client';
import { formatCompactNumber } from '@/lib/utils';

function ScorePill({ label, value, sub, tooltip }: { label: string; value: string; sub?: string; tooltip?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium">{label}</div>
        {tooltip ? (
          <span className="text-xs text-muted" title={tooltip}>
            i
          </span>
        ) : null}
      </div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      {sub ? <div className="text-xs text-muted mt-1">{sub}</div> : null}
    </div>
  );
}

export function RatingsCards({ movie }: { movie: Movie }) {
  const imdbScore = movie.imdbScore ? Number(movie.imdbScore) : null;
  const releaseYear = movie.releaseDate ? movie.releaseDate.getUTCFullYear() : null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <ScorePill
          label="IMDb"
          value={imdbScore != null ? `${imdbScore.toFixed(1)}/10` : 'N/A'}
          sub={movie.imdbVoteCount ? `${formatCompactNumber(movie.imdbVoteCount)} votes` : undefined}
          tooltip={imdbScore == null ? 'IMDb score is not available for this title.' : undefined}
        />
        <ScorePill
          label="Release"
          value={releaseYear ? String(releaseYear) : '—'}
        />
        <ScorePill
          label="Runtime"
          value={movie.durationMinutes ? `${movie.durationMinutes} min` : '—'}
        />
        <ScorePill
          label="Age Rating"
          value={movie.ageRating ?? '—'}
        />
        <ScorePill
          label="Language"
          value="—"
          tooltip="Language is not stored in the current catalog schema."
        />
      </div>

      <div className="text-xs text-muted">Ratings are shown from catalog data where available.</div>
    </div>
  );
}
