import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';
import { prisma } from '@/lib/prisma';
import { toSlug } from '@/lib/utils';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.public.NEXT_PUBLIC_SITE_URL;

  const movies = await prisma.movie.findMany({
    select: { movieId: true, title: true, createdAt: true },
    orderBy: { createdAt: 'desc' },
    take: 1000
  });

  const urls: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/trending`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/top`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/discover`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/about`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/contact`, changeFrequency: 'yearly', priority: 0.3 }
  ];

  for (const m of movies) {
    urls.push({
      url: `${base}/movie/${toSlug(m.title)}-${m.movieId}`,
      lastModified: m.createdAt,
      changeFrequency: 'weekly',
      priority: 0.6
    });
  }

  return urls;
}
