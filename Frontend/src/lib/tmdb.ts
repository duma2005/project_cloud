const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

export type TMDbMovie = {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  release_date: string;
  runtime?: number;
  poster_path: string | null;
  backdrop_path: string | null;
  genres?: { id: number; name: string }[];
  genre_ids?: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
};

export type TMDbPaged<T> = {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
};

async function tmdbFetch<T>(path: string, params?: Record<string, string | number | boolean | undefined>) {
  const url = new URL(TMDB_BASE + path);
  if (!TMDB_API_KEY) {
    throw new Error('TMDB_API_KEY is missing.');
  }
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined) continue;
      url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url, {
    // Next.js route cache: keep data fairly fresh; detail pages have DB TTL anyway.
    next: { revalidate: 60 * 10 }
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`TMDb error ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export function tmdbImage(path: string | null, size: 'w342' | 'w500' | 'w780' | 'original' = 'w500') {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export async function tmdbTrending() {
  return tmdbFetch<TMDbPaged<TMDbMovie>>('/trending/movie/week');
}

export async function tmdbTopRated(page = 1) {
  return tmdbFetch<TMDbPaged<TMDbMovie>>('/movie/top_rated', { page });
}

export async function tmdbUpcoming(page = 1) {
  return tmdbFetch<TMDbPaged<TMDbMovie>>('/movie/upcoming', { page });
}

export async function tmdbSearch(query: string, page = 1) {
  return tmdbFetch<TMDbPaged<TMDbMovie>>('/search/movie', { query, page, include_adult: false });
}

export async function tmdbMovieDetails(tmdbId: number) {
  return tmdbFetch<
    TMDbMovie & {
      genres: { id: number; name: string }[];
      runtime: number;
    }
  >(`/movie/${tmdbId}`);
}

export async function tmdbMovieCredits(tmdbId: number) {
  return tmdbFetch<{
    id: number;
    cast: { id: number; name: string; character?: string; profile_path: string | null }[];
    crew: { id: number; name: string; job?: string; department?: string; profile_path: string | null }[];
  }>(`/movie/${tmdbId}/credits`);
}

export async function tmdbExternalIds(tmdbId: number) {
  return tmdbFetch<{ id: number; imdb_id: string | null }>(`/movie/${tmdbId}/external_ids`);
}

export async function tmdbGenres() {
  return tmdbFetch<{ genres: { id: number; name: string }[] }>('/genre/movie/list');
}

export async function tmdbDiscover(params: {
  page?: number;
  with_genres?: string;
  primary_release_year?: number;
  sort_by?: string;
}) {
  return tmdbFetch<TMDbPaged<TMDbMovie>>('/discover/movie', {
    page: params.page ?? 1,
    with_genres: params.with_genres,
    primary_release_year: params.primary_release_year,
    sort_by: params.sort_by ?? 'popularity.desc',
    include_adult: false
  });
}
