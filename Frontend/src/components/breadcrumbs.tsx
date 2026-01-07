import Link from 'next/link';
import type { AppRoute } from '@/lib/routes';
import { toAppHref } from '@/lib/routes';

export function Breadcrumbs({ items }: { items: { label: string; href?: AppRoute }[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.label,
      item: it.href ? it.href : undefined
    }))
  };

  return (
    <div className="space-y-2">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap gap-x-2 gap-y-1">
          {items.map((it, idx) => (
            <li key={idx} className="flex items-center gap-2">
              {it.href ? (
                <Link href={toAppHref(it.href)} className="hover:text-text">
                  {it.label}
                </Link>
              ) : (
                <span className="text-text">{it.label}</span>
              )}
              {idx < items.length - 1 ? <span>/</span> : null}
            </li>
          ))}
        </ol>
      </nav>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
