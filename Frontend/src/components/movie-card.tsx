import Link from 'next/link';
import Image from 'next/image';
import { toSlug } from '@/lib/utils';
import type { MovieGridItem } from '@/components/movie-grid';
import { movieRoute, toAppHref } from '@/lib/routes';

export function MovieCard({ movie }: { movie: MovieGridItem }) {
  const href = toAppHref(movieRoute(toSlug(movie.title), movie.tmdbId));

  return (
    <Link href={href} className="group">
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="relative aspect-[2/3] bg-bg">
          {movie.posterUrl ? (
            <Image
              src={movie.posterUrl}
              alt={`${movie.title} poster`}
              fill
              sizes="(max-width: 768px) 50vw, 16vw"
              className="object-cover group-hover:scale-[1.02] transition"
            />
          ) : null}
        </div>
        <div className="p-2">
          <div className="text-sm font-medium leading-snug line-clamp-2">{movie.title}</div>
          <div className="text-xs text-muted">{movie.year}</div>
        </div>
      </div>
    </Link>
  );
}
