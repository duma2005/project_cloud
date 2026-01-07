import type { MetadataRoute } from 'next';
import { env } from '@/lib/env';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: env.public.NEXT_PUBLIC_SITE_NAME,
    short_name: 'FilmConsensus',
    start_url: '/',
    display: 'standalone',
    background_color: '#0B0F19',
    theme_color: '#0B0F19',
    icons: [{ src: '/icon', sizes: '64x64', type: 'image/svg+xml' }]
  };
}
