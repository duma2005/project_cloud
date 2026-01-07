'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { SearchBar } from '@/components/search-bar';
import { AuthMenu } from '@/components/auth-menu';
import type { StaticRoute } from '@/lib/routes';

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const navSections: { title: string; links: { href: StaticRoute; label: string }[] }[] = [
    {
      title: 'Browse',
      links: [
        { href: '/', label: 'Home' },
        { href: '/trending', label: 'Trending' },
        { href: '/top', label: 'Top' },
        { href: '/discover', label: 'Discover' },
        { href: '/watchlist', label: 'Watchlist' }
      ]
    },
    {
      title: 'Info',
      links: [
        { href: '/about', label: 'About' },
        { href: '/contact', label: 'Contact' }
      ]
    }
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('overflow-hidden', menuOpen);
    return () => document.body.classList.remove('overflow-hidden');
  }, [menuOpen]);

  return (
    <header className="relative z-30 border-b border-border bg-bg/70 backdrop-blur supports-[backdrop-filter]:bg-bg/50">
      <div className="container h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="group inline-flex items-center justify-center rounded-full border border-border p-2 text-muted transition hover:text-text focus-ring"
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            aria-label="Toggle menu"
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span className="flex flex-col gap-1">
              <span className="h-0.5 w-5 rounded-full bg-muted transition group-hover:bg-text" />
              <span className="h-0.5 w-5 rounded-full bg-muted transition group-hover:bg-text" />
              <span className="h-0.5 w-5 rounded-full bg-muted transition group-hover:bg-text" />
            </span>
          </button>
          <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-accent text-black">FC</span>
            <span className="hidden sm:inline">FilmConsensus</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-[320px] hidden lg:block">
            <SearchBar compact />
          </div>
          <AuthMenu />
        </div>
      </div>
      {mounted
        ? createPortal(
            <div
              className={`fixed inset-0 z-[999] isolate overflow-y-auto bg-[#05060A] transition-[transform,opacity] duration-500 ease-out ${
                menuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
              }`}
              aria-hidden={!menuOpen}
            >
              <div className="container flex h-full flex-col">
                <div className="flex h-16 items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex h-8 w-8 items-center justify-center rounded bg-accent text-black">
                      FC
                    </span>
                    <span className="text-sm font-semibold tracking-[0.2em] text-muted">MENU</span>
                  </div>
                  <button
                    type="button"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent text-black transition hover:scale-105"
                    onClick={() => setMenuOpen(false)}
                    aria-label="Close menu"
                  >
                    ✕
                  </button>
                </div>
                <nav id="primary-navigation" className="flex flex-1 items-center">
                  <div className="grid w-full gap-10 text-sm text-muted sm:grid-cols-2 lg:grid-cols-3">
                    {navSections.map((section) => (
                      <div key={section.title} className="space-y-4">
                        <div className="text-xs uppercase tracking-[0.3em] text-accent">{section.title}</div>
                        <div className="space-y-3 text-2xl font-semibold text-text sm:text-3xl">
                          {section.links.map((link) => (
                            <Link
                              key={link.href}
                              className="block border-b border-border/60 pb-2 transition hover:text-accent"
                              href={link.href}
                              onClick={() => setMenuOpen(false)}
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </nav>
              </div>
            </div>,
            document.body
          )
        : null}
    </header>
  );
}
