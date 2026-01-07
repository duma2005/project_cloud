import { clamp } from '@/lib/utils';

export type RatingSource = 'IMDB' | 'RT_CRITIC' | 'RT_AUDIENCE' | 'METACRITIC' | 'TMDB';

export type AggregatedRatings = {
  imdb?: { score10: number; votes?: number | null; updatedAt: string };
  metacritic?: { score100: number; updatedAt: string };
  rtCritic?: { score100: number; updatedAt: string };
  rtAudience?: { score100: number; updatedAt: string };
  tmdb?: { score10: number; votes?: number | null; updatedAt: string };
};

export type ConsensusResult = {
  consensus: number | null; // 0-100 rounded
  confidence: number; // 0-100
  formula: string;
  normalized: Partial<Record<RatingSource, number>>;
  weightsUsed: Partial<Record<RatingSource, number>>;
};

const DEFAULT_WEIGHTS: Record<RatingSource, number> = {
  IMDB: 0.35,
  RT_CRITIC: 0.35,
  METACRITIC: 0.2,
  TMDB: 0.1,
  RT_AUDIENCE: 0 // displayed but not part of consensus by default
};

export function computeConsensus(r: AggregatedRatings): ConsensusResult {
  const normalized: Partial<Record<RatingSource, number>> = {};

  if (r.imdb) normalized.IMDB = clamp(r.imdb.score10 * 10, 0, 100);
  if (r.tmdb) normalized.TMDB = clamp(r.tmdb.score10 * 10, 0, 100);
  if (r.rtCritic) normalized.RT_CRITIC = clamp(r.rtCritic.score100, 0, 100);
  if (r.metacritic) normalized.METACRITIC = clamp(r.metacritic.score100, 0, 100);

  const available = Object.keys(normalized) as RatingSource[];
  if (available.length === 0) {
    return {
      consensus: null,
      confidence: 0,
      formula: 'No rating sources available.',
      normalized,
      weightsUsed: {}
    };
  }

  const sumW = available.reduce((acc, s) => acc + (DEFAULT_WEIGHTS[s] ?? 0), 0);
  const weightsUsed: Partial<Record<RatingSource, number>> = {};

  // normalize weights among available sources
  for (const s of available) {
    const w = (DEFAULT_WEIGHTS[s] ?? 0) / (sumW || 1);
    weightsUsed[s] = w;
  }

  const consensusRaw = available.reduce((acc, s) => acc + (normalized[s] ?? 0) * (weightsUsed[s] ?? 0), 0);
  const consensus = Math.round(consensusRaw);

  // Confidence heuristic:
  // - base on how many sources we have (max 4)
  // - add signal from vote counts when available (IMDb/TMDb)
  const sourcesScore = clamp((available.length / 4) * 70, 0, 70);
  const votes = (r.imdb?.votes ?? 0) + (r.tmdb?.votes ?? 0);
  const votesScore = clamp(Math.log10(votes + 1) / 6 * 30, 0, 30); // ~0..30
  const confidence = Math.round(clamp(sourcesScore + votesScore, 0, 100));

  const formula = `Consensus = Σ(normalized_source × weight), normalized to 0–100. Weights: IMDb 0.35, RT Critic 0.35, Metacritic 0.20, TMDb 0.10 (renormalized if missing).`;

  return { consensus, confidence, formula, normalized, weightsUsed };
}

export function parseRatingValue(source: RatingSource, raw: string): number | null {
  const v = raw.trim();
  if (source === 'IMDB') {
    const m = v.match(/^(\d+(?:\.\d+)?)\s*\/\s*10/);
    if (!m) return null;
    return Number(m[1]);
  }
  if (source === 'RT_CRITIC' || source === 'RT_AUDIENCE') {
    const m = v.match(/^(\d+(?:\.\d+)?)%/);
    if (!m) return null;
    return Number(m[1]);
  }
  if (source === 'METACRITIC') {
    const m = v.match(/^(\d+)(?:\s*\/\s*100)?/);
    if (!m) return null;
    return Number(m[1]);
  }
  return null;
}
