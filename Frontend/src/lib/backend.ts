import { env } from '@/lib/env';

const SITE_URL = env.public.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
const BACKEND_PREFIX = '/backend';

export function backendUrl(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${BACKEND_PREFIX}${normalized}`;
}
