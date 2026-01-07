import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getOrRefreshMovie } from '@/lib/movie-service';
import { formatRuntime, toSlug } from '@/lib/utils';
import { RatingsCards } from '@/components/ratings-cards';
import { RatingPanel } from '@/components/rating-panel';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { WatchlistButton } from '@/components/watchlist-button';

function parseMovieIdFromSlug(slug: string) {
  const m = slug.match(/-(\d+)$/);
  return m ? Number(m[1]) : null;
}

function getTrailerEmbedUrl(url?: string | null) {
  if (!url) return null;
  const youtubeMatch = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/
  );
  if (youtubeMatch) return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  return null;
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const movieId = parseMovieIdFromSlug(params.slug);
  if (!movieId) return { title: 'Movie' };

  const movie = await getOrRefreshMovie(movieId);
  if (!movie) return { title: 'Movie' };
  const year = movie.releaseDate ? movie.releaseDate.getUTCFullYear() : '';
  const title = year ? `${movie.title} (${year})` : movie.title;

  const canonical = `/movie/${toSlug(movie.title)}-${movie.movieId}`;

  return {
    title,
    description: movie.description ?? movie.storyline ?? undefined,
    alternates: { canonical },
    openGraph: {
      title,
      description: movie.description ?? movie.storyline ?? undefined
    }
  };
}

export default async function MovieDetailPage({ params }: { params: { slug: string } }) {
  const movieId = parseMovieIdFromSlug(params.slug);
  if (!movieId) notFound();

  const movie = await getOrRefreshMovie(movieId);
  if (!movie) notFound();

  const year = movie.releaseDate ? movie.releaseDate.toISOString().slice(0, 4) : '—';
  const genres = movie.genres.map((g) => g.genre.name);
  const cast = movie.cast
    .filter((c) => c.role === 'Actor')
    .slice(0, 12);
  const director = movie.cast.find((c) => c.role === 'Director');
  const posterUrl = movie.posterUrl || movie.coverUrl || null;
  const coverUrl = movie.coverUrl || movie.posterUrl || null;
  const trailerUrl = movie.trailerUrl || null;
  const trailerEmbedUrl = getTrailerEmbedUrl(trailerUrl);

  const jsonLdMovie = {
    '@context': 'https://schema.org',
    '@type': 'Movie',
    name: movie.title,
    datePublished: movie.releaseDate ? movie.releaseDate.toISOString().slice(0, 10) : undefined,
    description: movie.description ?? movie.storyline ?? undefined,
    director: director ? { '@type': 'Person', name: director.person.fullName } : undefined
  };

  return (
    <div className="container space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Movie', href: '/discover' },
          { label: movie.title }
        ]}
      />

      <section className="card overflow-hidden">
        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
            <div className="mx-auto w-full max-w-[220px] lg:mx-0">
              <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-border bg-bg/40 shadow-lg">
                {posterUrl ? (
                  <Image
                    src={posterUrl}
                    alt={`${movie.title} poster`}
                    fill
                    sizes="(max-width: 1024px) 60vw, 220px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">No poster</div>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative aspect-video overflow-hidden rounded-xl border border-border bg-bg/40 shadow-lg">
                {trailerEmbedUrl ? (
                  <iframe
                    title={`${movie.title} trailer`}
                    src={trailerEmbedUrl}
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : coverUrl ? (
                  <Image
                    src={coverUrl}
                    alt={`${movie.title} trailer preview`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 720px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted">No trailer</div>
                )}
                {!trailerEmbedUrl ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/70 via-black/20 to-transparent">
                    {trailerUrl ? (
                      <a
                        href={trailerUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black"
                      >
                        Watch trailer
                      </a>
                    ) : (
                      <div className="rounded-full bg-black/60 px-4 py-2 text-xs text-white">
                        Trailer unavailable
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
              {trailerUrl && !trailerEmbedUrl ? (
                <div className="text-xs text-muted">
                  Trailer link:{' '}
                  <a href={trailerUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                    Open in new tab
                  </a>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{movie.title}</h1>
            <div className="text-muted flex flex-wrap gap-x-3 gap-y-1 text-sm">
              <span>{year}</span>
              <span>•</span>
              <span>{formatRuntime(movie.durationMinutes ?? undefined)}</span>
              {genres.length > 0 ? (
                <>
                  <span>•</span>
                  <span>{genres.join(', ')}</span>
                </>
              ) : null}
              {director ? (
                <>
                  <span>•</span>
                  <span>Director: {director.person.fullName}</span>
                </>
              ) : null}
            </div>

            <div className="pt-2">
              <WatchlistButton movieId={movie.movieId} title={movie.title} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Overview</h2>
                <p className="text-muted leading-relaxed">{movie.description || movie.storyline || 'No overview available.'}</p>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold">Ratings</h2>
                <RatingsCards movie={movie} />
                <RatingPanel movieId={movie.movieId} />
              </div>
            </div>

            <div className="pt-4">
              <h2 className="text-lg font-semibold">Top cast</h2>
              <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {cast.map((c) => (
                  <div key={`${c.movieId}-${c.personId}`} className="rounded-lg border border-border bg-bg/30 p-2">
                    <div className="text-sm font-medium">{c.person.fullName}</div>
                    <div className="text-xs text-muted">{c.characterName || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdMovie) }} />
    </div>
  );
}
