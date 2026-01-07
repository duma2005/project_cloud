import type { Metadata } from 'next';
import Link from 'next/link';
import { MovieGrid } from '@/components/movie-grid';
import { prisma } from '@/lib/prisma';

export const metadata: Metadata = { title: 'Discover' };

export default async function DiscoverPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = searchParams.page ? Number(searchParams.page) : 1;
  const pageSize = 24;
  const popular = await prisma.movie.findMany({
    orderBy: { imdbScore: 'desc' },
    take: pageSize,
    skip: Math.max(0, (page - 1) * pageSize),
    select: { movieId: true, title: true, releaseDate: true, posterUrl: true }
  });

  return (
    <div className="container space-y-5">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Discover</h1>
        <p className="text-muted">Browse the catalog by popularity.</p>
      </div>

      <MovieGrid
        movies={popular.map((m) => ({
          tmdbId: m.movieId,
          title: m.title,
          year: m.releaseDate ? String(m.releaseDate.getUTCFullYear()) : '—',
          posterUrl: m.posterUrl
        }))}
      />

      <div className="flex items-center justify-between">
        <Link
          className={`text-accent hover:underline ${page <= 1 ? 'pointer-events-none opacity-50' : ''}`}
          href={{ pathname: '/discover', query: { page: String(Math.max(1, page - 1)) } }}
        >
          Prev
        </Link>
        <div className="text-sm text-muted">Page {page}</div>
        <Link className="text-accent hover:underline" href={{ pathname: '/discover', query: { page: String(page + 1) } }}>
          Next
        </Link>
      </div>
    </div>
  );
}
