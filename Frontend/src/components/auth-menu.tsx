'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export function AuthMenu() {
  const { user, status, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current || wrapperRef.current.contains(event.target as Node)) return;
      setOpen(false);
    };

    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  if (status === 'loading') {
    return <div className="h-9 w-20 animate-pulse rounded-full bg-border/40" aria-hidden />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="focus-ring inline-flex items-center rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:text-text"
      >
        Sign in
      </Link>
    );
  }

  const initial = user.email ? user.email.slice(0, 1).toUpperCase() : 'U';

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className="focus-ring inline-flex items-center gap-2 rounded-full border border-border px-3 py-2 text-sm text-muted transition hover:text-text"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-accent text-xs font-semibold text-black">
          {initial}
        </span>
        <span className="hidden sm:inline max-w-[140px] truncate">{user.email}</span>
        <span className="text-xs">v</span>
      </button>

      {open ? (
        <div
          className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-card p-2 shadow-soft"
          role="menu"
        >
          <div className="px-3 py-2 text-xs text-muted">Signed in as {user.email}</div>
          <div className="h-px bg-border my-1" />
          <Link
            href="/admin"
            className="block rounded-lg px-3 py-2 text-left text-sm text-text transition hover:bg-bg"
            role="menuitem"
          >
            Admin dashboard
          </Link>
          <button
            type="button"
            onClick={() => {
              logout();
              setOpen(false);
            }}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-text transition hover:bg-bg"
            role="menuitem"
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
