import { MovieCard } from '@/components/movie-card';

export type MovieGridItem = {
  tmdbId: number;
  title: string;
  year: string;
  posterUrl: string | null;
};

export function MovieGrid({ movies }: { movies: MovieGridItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {movies.map((m) => (
        <MovieCard key={m.tmdbId} movie={m} />
      ))}
    </div>
  );
}
