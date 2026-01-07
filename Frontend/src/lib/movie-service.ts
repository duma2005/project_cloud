import { prisma } from '@/lib/prisma';

export async function getOrRefreshMovie(movieId: number) {
  return prisma.movie.findUnique({
    where: { movieId },
    include: {
      genres: { include: { genre: true } },
      cast: { include: { person: true } }
    }
  });
}

export async function getMoviePeople(movieId: number) {
  return prisma.movieCast.findMany({
    where: { movieId },
    include: { person: true },
    orderBy: [{ role: 'asc' }, { person: { fullName: 'asc' } }]
  });
}
