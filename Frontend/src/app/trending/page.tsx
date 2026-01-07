import type { Metadata } from 'next';
import { MovieGrid } from '@/components/movie-grid';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Trending' };

export default async function TrendingPage() {
  const trending = await prisma.movie.findMany({
    orderBy: { createdAt: 'desc' },
    take: 48,
    select: { movieId: true, title: true, releaseDate: true, posterUrl: true }
  });
  return (
    <div className="container space-y-4">
      <h1 className="text-2xl font-semibold">Trending</h1>
      <MovieGrid
        movies={trending.map((m) => ({
          tmdbId: m.movieId,
          title: m.title,
          year: m.releaseDate ? String(m.releaseDate.getUTCFullYear()) : '—',
          posterUrl: m.posterUrl
        }))}
      />
    </div>
  );
}
