import { backendUrl } from '@/lib/backend';

const TRAKT_BASE = backendUrl('/external/trakt');

export type TraktMovieIds = {
  trakt: number;
  slug: string;
  imdb?: string;
  tmdb?: number;
};

export type TraktMovie = {
  title: string;
  year: number | null;
  ids: TraktMovieIds;
};

export type TraktMovieExtended = TraktMovie & {
  tagline?: string;
  overview?: string;
  released?: string;
  runtime?: number;
  country?: string;
  genres?: string[];
  rating?: number; // 0..10
  votes?: number;
};

export type TraktCastMember = {
  character?: string;
  person: { name: string; ids: { trakt: number; slug: string } };
};

async function traktFetch<T>(path: string, params?: Record<string, string | number | undefined>) {
  const url = new URL(TRAKT_BASE + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url, { next: { revalidate: 60 * 10 } });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Trakt error ${res.status}: ${text}`);
  }

  return (await res.json()) as T;
}

export async function traktTrending(page = 1) {
  // returns [{ watchers, movie }]
  return traktFetch<{ watchers: number; movie: TraktMovie }[]>('/movies/trending', { page, limit: 24 });
}

export async function traktPopular(page = 1) {
  return traktFetch<TraktMovie[]>('/movies/popular', { page, limit: 24 });
}

export async function traktAnticipated(page = 1) {
  // upcoming-ish
  return traktFetch<{ list_count: number; movie: TraktMovie }[]>('/movies/anticipated', { page, limit: 24 });
}

export async function traktSearchMovies(query: string, page = 1) {
  // returns [{ type, score, movie }]
  return traktFetch<{ type: 'movie'; score: number; movie: TraktMovie }[]>('/search/movie', {
    query,
    page,
    limit: 8
  });
}

export async function traktMovieSummary(traktIdOrSlug: string | number) {
  return traktFetch<TraktMovieExtended>(`/movies/${traktIdOrSlug}`, { extended: 'full' });
}

export async function traktMoviePeople(traktIdOrSlug: string | number) {
  return traktFetch<{ cast: TraktCastMember[]; crew: { directing?: { job: string; person: { name: string } }[] } }>(
    `/movies/${traktIdOrSlug}/people`,
    { extended: 'full' }
  );
}
