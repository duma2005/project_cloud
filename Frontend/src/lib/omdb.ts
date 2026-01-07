import { backendUrl } from '@/lib/backend';

const OMDB_BASE = backendUrl('/external/omdb');

export type OMDbRating = { Source: string; Value: string };

export type OMDbResponse = {
  Response: 'True' | 'False';
  Error?: string;
  imdbID?: string;
  Ratings?: OMDbRating[];
  Metascore?: string;
  imdbRating?: string;
  imdbVotes?: string;
  tomatoMeter?: string;
  tomatoUserMeter?: string;
  tomatoUserReviews?: string;
  tomatoReviews?: string;
};

export async function omdbByImdbId(imdbId: string) {
  const url = new URL(OMDB_BASE);
  url.searchParams.set('i', imdbId);
  // Include Rotten Tomatoes fields when available (OMDb-specific extension)
  url.searchParams.set('tomatoes', 'true');

  const res = await fetch(url, { next: { revalidate: 60 * 60 } });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OMDb error ${res.status}: ${text}`);
  }
  const data = (await res.json()) as OMDbResponse;
  if (data.Response !== 'True') throw new Error(data.Error || 'OMDb failed');
  return data;
}

export function parseOmdbVotes(v?: string) {
  if (!v) return null;
  const n = Number(v.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}
