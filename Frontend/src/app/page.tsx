import type { CSSProperties } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Bebas_Neue, Space_Grotesk } from 'next/font/google';
import { MovieGrid } from '@/components/movie-grid';
import { prisma } from '@/lib/prisma';
import { movieRoute, toAppHref } from '@/lib/routes';
import { formatRuntime, toSlug } from '@/lib/utils';

const displayFont = Bebas_Neue({ weight: '400', subsets: ['latin'] });
const bodyFont = Space_Grotesk({ weight: ['400', '500', '600'], subsets: ['latin'] });

type MovieSnapshot = {
  movieId: number;
  title: string;
  releaseDate: Date | null;
  posterUrl: string | null;
  coverUrl: string | null;
  description: string | null;
  storyline: string | null;
  durationMinutes: number | null;
  ageRating: string | null;
  imdbScore: { toString: () => string } | null;
};

type HomepageSettings = {
  hero_movie_id?: number | null;
  hero_tagline?: string | null;
  top_ten_title?: string | null;
  fan_favorites_title?: string | null;
  new_arrivals_title?: string | null;
  top_ten_ids?: number[] | null;
  fan_favorites_ids?: number[] | null;
  new_arrivals_ids?: number[] | null;
};

async function getHomepageSettings(): Promise<HomepageSettings | null> {
  const backendBase = (process.env.BACKEND_API_URL || 'http://localhost:8000').replace(/\/$/, '');
  try {
    const res = await fetch(`${backendBase}/homepage`, { cache: 'no-store' });
    if (!res.ok) return null;
    return (await res.json()) as HomepageSettings;
  } catch {
    return null;
  }
}

function orderByIds<T extends { movieId: number }>(items: T[], ids: number[]) {
  const lookup = new Map(items.map((item) => [item.movieId, item]));
  return ids.map((id) => lookup.get(id)).filter(Boolean) as T[];
}

function toGridItem(movie: { movieId: number; title: string; releaseDate: Date | null; posterUrl: string | null }) {
  return {
    tmdbId: movie.movieId,
    title: movie.title,
    year: movie.releaseDate ? String(movie.releaseDate.getUTCFullYear()) : '—',
    posterUrl: movie.posterUrl
  };
}

function toMovieHref(movie: { title: string; movieId: number }) {
  return toAppHref(movieRoute(toSlug(movie.title), movie.movieId));
}

function formatYear(date: Date | null) {
  return date ? String(date.getUTCFullYear()) : '—';
}

export default async function HomePage() {
  const [trending, popular, anticipated, genres, homepageSettings] = await Promise.all([
    prisma.movie.findMany({
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        movieId: true,
        title: true,
        releaseDate: true,
        posterUrl: true,
        coverUrl: true,
        description: true,
        storyline: true,
        durationMinutes: true,
        ageRating: true,
        imdbScore: true
      }
    }),
    prisma.movie.findMany({
      orderBy: { imdbScore: 'desc' },
      take: 12,
      select: {
        movieId: true,
        title: true,
        releaseDate: true,
        posterUrl: true,
        coverUrl: true,
        description: true,
        storyline: true,
        durationMinutes: true,
        ageRating: true,
        imdbScore: true
      }
    }),
    prisma.movie.findMany({
      orderBy: { releaseDate: 'desc' },
      take: 12,
      select: {
        movieId: true,
        title: true,
        releaseDate: true,
        posterUrl: true,
        coverUrl: true,
        description: true,
        storyline: true,
        durationMinutes: true,
        ageRating: true,
        imdbScore: true
      }
    }),
    prisma.genre.findMany({
      orderBy: { name: 'asc' },
      take: 12,
      select: { genreId: true, name: true }
    }),
    getHomepageSettings()
  ]);

  const heroOverrideId = homepageSettings?.hero_movie_id ?? null;
  const heroOverride = heroOverrideId
    ? await prisma.movie.findUnique({
        where: { movieId: heroOverrideId },
        select: {
          movieId: true,
          title: true,
          releaseDate: true,
          posterUrl: true,
          coverUrl: true,
          description: true,
          storyline: true,
          durationMinutes: true,
          ageRating: true,
          imdbScore: true
        }
      })
    : null;

  const hero: MovieSnapshot | undefined = heroOverride ?? trending[0] ?? popular[0] ?? anticipated[0];
  const heroImage = hero?.coverUrl ?? hero?.posterUrl ?? null;
  const heroDescription =
    homepageSettings?.hero_tagline ||
    hero?.storyline ||
    hero?.description ||
    'Discover curated picks from the FilmConsensus catalog.';
  const heroScore = hero?.imdbScore ? `${hero.imdbScore.toString()}/10` : 'NR';
  const heroMeta = hero
    ? [formatYear(hero.releaseDate), formatRuntime(hero.durationMinutes), hero.ageRating || 'NR'].filter(
        (item) => item !== '—'
      )
    : [];

  const upNext = trending.filter((movie) => movie.movieId !== hero?.movieId).slice(0, 4);
  const topTenIds = homepageSettings?.top_ten_ids ?? [];
  const fanFavoriteIds = homepageSettings?.fan_favorites_ids ?? [];
  const newArrivalIds = homepageSettings?.new_arrivals_ids ?? [];

  const [topTenCustom, fanFavoritesCustom, newArrivalsCustom] = await Promise.all([
    topTenIds.length
      ? prisma.movie.findMany({
          where: { movieId: { in: topTenIds } },
          select: { movieId: true, title: true, releaseDate: true, posterUrl: true }
        })
      : Promise.resolve([]),
    fanFavoriteIds.length
      ? prisma.movie.findMany({
          where: { movieId: { in: fanFavoriteIds } },
          select: { movieId: true, title: true, releaseDate: true, posterUrl: true }
        })
      : Promise.resolve([]),
    newArrivalIds.length
      ? prisma.movie.findMany({
          where: { movieId: { in: newArrivalIds } },
          select: { movieId: true, title: true, releaseDate: true, posterUrl: true }
        })
      : Promise.resolve([])
  ]);

  const topTen = topTenIds.length ? orderByIds(topTenCustom, topTenIds).slice(0, 10) : popular.slice(0, 10);
  const fanFavorites = fanFavoriteIds.length
    ? orderByIds(fanFavoritesCustom, fanFavoriteIds).slice(0, 12)
    : popular.slice(0, 12);
  const newArrivals = newArrivalIds.length
    ? orderByIds(newArrivalsCustom, newArrivalIds).slice(0, 12)
    : anticipated.slice(0, 12);

  const topTenTitle = homepageSettings?.top_ten_title || 'Top 10 this week';
  const fanFavoritesTitle = homepageSettings?.fan_favorites_title || 'Fan favorites';
  const newArrivalsTitle = homepageSettings?.new_arrivals_title || 'New arrivals';

  const heroStyle = {
    '--hero-accent': '#F5C518',
    '--hero-deep': '#0B0F19',
    '--hero-shadow': '#1D1600'
  } as CSSProperties;

  return (
    <div className={`${bodyFont.className} container space-y-16 pb-16`} style={heroStyle}>
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card/60">
        <div className="pointer-events-none absolute -left-24 -top-28 h-64 w-64 rounded-full bg-[radial-gradient(circle_at_center,_var(--hero-accent),_transparent_70%)] opacity-40 blur-2xl" />
        <div className="pointer-events-none absolute -right-10 top-10 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,_var(--hero-shadow),_transparent_70%)] opacity-60 blur-2xl" />
        <div className="relative grid gap-6 p-6 lg:grid-cols-[1.3fr_0.7fr] lg:p-8">
          {hero ? (
            <Link
              href={toMovieHref(hero)}
              className="group relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[rgba(245,197,24,0.2)] via-transparent to-[rgba(255,255,255,0.04)]"
            >
              <div className="absolute inset-0">
                {heroImage ? (
                  <Image
                    src={heroImage}
                    alt={`${hero.title} poster`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    className="object-cover opacity-70 transition duration-700 group-hover:scale-[1.02]"
                    priority
                  />
                ) : (
                  <div className="h-full w-full bg-bg" />
                )}
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-transparent" />
              <div className="relative z-10 flex h-full flex-col justify-end gap-4 p-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent/80">Featured Today</p>
                  <h1 className={`${displayFont.className} text-4xl tracking-wide sm:text-5xl`}>{hero.title}</h1>
                  <p className="max-w-xl text-sm text-muted line-clamp-3">{heroDescription}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                  {heroMeta.map((item, index) => (
                    <span key={`${item}-${index}`} className="rounded-full border border-border bg-card/70 px-3 py-1">
                      {item}
                    </span>
                  ))}
                  <span className="rounded-full border border-border bg-card/70 px-3 py-1">{heroScore}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
                  <span className="rounded-full bg-accent px-4 py-2 text-black">Open detail</span>
                  <span className="rounded-full border border-border px-4 py-2 text-text/80">Add to watchlist</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="rounded-2xl border border-border bg-bg/70 p-8 text-muted">No movies available yet.</div>
          )}

          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card/70 p-4">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Up next</h2>
                <Link className="text-xs text-accent hover:underline" href="/trending">
                  View all
                </Link>
              </div>
              <div className="mt-4 space-y-3">
                {upNext.length ? (
                  upNext.map((movie) => (
                    <Link
                      key={movie.movieId}
                      href={toMovieHref(movie)}
                      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-bg/60 p-2 transition hover:border-accent/40"
                    >
                      <div className="relative h-16 w-12 overflow-hidden rounded-lg bg-bg">
                        {movie.posterUrl ? (
                          <Image
                            src={movie.posterUrl}
                            alt={`${movie.title} poster`}
                            fill
                            sizes="48px"
                            className="object-cover transition group-hover:scale-[1.03]"
                          />
                        ) : null}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium line-clamp-2">{movie.title}</div>
                        <div className="text-xs text-muted">{formatYear(movie.releaseDate)}</div>
                      </div>
                      <div className="text-xs text-muted">
                        {movie.imdbScore ? `${movie.imdbScore.toString()}/10` : 'NR'}
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-sm text-muted">No picks yet.</div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-gradient-to-br from-[rgba(245,197,24,0.18)] to-[rgba(11,15,25,0.9)] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.25em] text-accent/80">Your corner</div>
              <div className="mt-2 text-lg font-semibold">Build a watchlist that feels like you.</div>
              <p className="mt-2 text-sm text-muted">Save titles, rank them, and share your picks.</p>
              <Link
                href="/watchlist"
                className="mt-4 inline-flex rounded-full bg-accent px-4 py-2 text-sm font-semibold text-black"
              >
                Go to watchlist
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className={`${displayFont.className} text-3xl tracking-wide`}>{topTenTitle}</h2>
          <Link className="text-sm text-accent hover:underline" href="/top">
            View all
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {topTen.map((movie, index) => (
            <Link
              key={movie.movieId}
              href={toMovieHref(movie)}
              className="group flex items-center gap-3 rounded-2xl border border-border bg-card/70 p-3 transition hover:border-accent/40"
            >
              <div className={`${displayFont.className} text-3xl text-accent/80`}>{String(index + 1).padStart(2, '0')}</div>
              <div className="relative h-20 w-14 overflow-hidden rounded-lg bg-bg">
                {movie.posterUrl ? (
                  <Image
                    src={movie.posterUrl}
                    alt={`${movie.title} poster`}
                    fill
                    sizes="56px"
                    className="object-cover transition group-hover:scale-[1.03]"
                  />
                ) : null}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold line-clamp-2">{movie.title}</div>
                <div className="text-xs text-muted">{formatYear(movie.releaseDate)}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className={`${displayFont.className} text-3xl tracking-wide`}>{fanFavoritesTitle}</h2>
          <Link className="text-sm text-accent hover:underline" href="/top">
            Explore
          </Link>
        </div>
        <MovieGrid movies={fanFavorites.map(toGridItem)} />
      </section>

      <section className="space-y-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className={`${displayFont.className} text-3xl tracking-wide`}>{newArrivalsTitle}</h2>
          <Link className="text-sm text-accent hover:underline" href="/trending">
            See more
          </Link>
        </div>
        <MovieGrid movies={newArrivals.map(toGridItem)} />
      </section>

      <section className="space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className={`${displayFont.className} text-2xl tracking-wide`}>Browse by genre</h2>
          <Link className="text-sm text-accent hover:underline" href="/discover">
            Discover
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {genres.map((genre) => (
            <span key={genre.genreId} className="rounded-full border border-border bg-card/70 px-4 py-2 text-sm">
              {genre.name}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
