import type { Metadata } from 'next';
import { MovieGrid } from '@/components/movie-grid';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Popular' };

export default async function TopRatedPage() {
  const popular = await prisma.movie.findMany({
    orderBy: { imdbScore: 'desc' },
    take: 60,
    select: { movieId: true, title: true, releaseDate: true, posterUrl: true }
  });
  return (
    <div className="container space-y-4">
      <h1 className="text-2xl font-semibold">Popular</h1>
      <MovieGrid
        movies={popular.map((m) => ({
          tmdbId: m.movieId,
          title: m.title,
          year: m.releaseDate ? String(m.releaseDate.getUTCFullYear()) : '—',
          posterUrl: m.posterUrl
        }))}
      />
    </div>
  );
}
