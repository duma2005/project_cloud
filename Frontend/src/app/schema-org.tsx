import { env } from '@/lib/env';

export function GlobalJsonLd() {
  const website = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: env.public.NEXT_PUBLIC_SITE_NAME,
    url: env.public.NEXT_PUBLIC_SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${env.public.NEXT_PUBLIC_SITE_URL}/discover?q={search_term_string}`,
      'query-input': 'required name=search_term_string'
    }
  };

  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: env.public.NEXT_PUBLIC_SITE_NAME,
    url: env.public.NEXT_PUBLIC_SITE_URL
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
    </>
  );
}
