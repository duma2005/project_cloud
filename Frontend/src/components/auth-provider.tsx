'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type AuthUser = {
  email: string;
  token: string;
};

type LoginResult = { ok: true } | { ok: false; error: string };
type RegisterResult = { ok: true } | { ok: false; error: string };

type AuthContextValue = {
  user: AuthUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (email: string, password: string, fullName?: string) => Promise<RegisterResult>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = 'fc.auth';

function readStoredAuth(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<AuthUser> & { provider?: string };
    if (!parsed?.token || !parsed?.email) return null;
    return { email: parsed.email, token: parsed.token };
  } catch {
    return null;
  }
}

function writeStoredAuth(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  if (!user) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    const stored = readStoredAuth();
    if (stored) {
      setUser(stored);
      setStatus('authenticated');
    } else {
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== STORAGE_KEY) return;
      const stored = readStoredAuth();
      setUser(stored);
      setStatus(stored ? 'authenticated' : 'unauthenticated');
    }

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string };

    if (!res.ok) {
      return { ok: false, error: data?.error || 'Login failed' };
    }

    if (!data?.access_token) {
      return { ok: false, error: 'Missing access token' };
    }

    const nextUser = { email, token: data.access_token };
    writeStoredAuth(nextUser);
    setUser(nextUser);
    setStatus('authenticated');
    return { ok: true };
  }, []);

  const register = useCallback(async (email: string, password: string, fullName?: string): Promise<RegisterResult> => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, full_name: fullName })
    });

    const data = (await res.json().catch(() => ({}))) as { access_token?: string; error?: string };

    if (!res.ok) {
      return { ok: false, error: data?.error || 'Registration failed' };
    }

    if (!data?.access_token) {
      return { ok: false, error: 'Missing access token' };
    }

    const nextUser = { email, token: data.access_token };
    writeStoredAuth(nextUser);
    setUser(nextUser);
    setStatus('authenticated');
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    writeStoredAuth(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
