'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const pathname = usePathname();

  if (status === 'loading') {
    return <div className="card p-6 text-muted">Loading...</div>;
  }

  if (!user) {
    const next = encodeURIComponent(pathname || '/');
    return (
      <div className="card p-6 space-y-3">
        <div className="text-lg font-semibold">Sign in required</div>
        <div className="text-sm text-muted">Please sign in to continue.</div>
        <Link
          href={`/login?next=${next}`}
          className="focus-ring inline-flex w-fit rounded-md bg-accent px-4 py-2 text-sm font-medium text-black"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
