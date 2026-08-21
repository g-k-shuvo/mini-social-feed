import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, tokenStore, setSessionLostHandler } from '../../api/client';
import type { AuthPayload, SessionUser } from '../../api/types';
import { registerDevice, unregisterDevice } from '../push/push';

type Status = 'restoring' | 'signedIn' | 'signedOut';

interface AuthValue {
  status: Status;
  user: SessionUser | null;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (input: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
  }) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('restoring');
  const [user, setUser] = useState<SessionUser | null>(null);
  const qc = useQueryClient();

  const adopt = useCallback(
    async (payload: AuthPayload) => {
      await tokenStore.set(payload.accessToken, payload.refreshToken);
      setUser(payload.user);
      setStatus('signedIn');
      // Fire and forget: a denied notification permission must never block
      // sign-in, and the app is fully usable without it.
      void registerDevice();
    },
    [],
  );

  /**
   * Restore on cold start. The token is validated against /auth/me rather than
   * trusted, so a revoked session lands on Login instead of a feed that 401s
   * one request later. The interceptor gets one silent refresh first.
   */
  useEffect(() => {
    let cancelled = false;

    setSessionLostHandler(() => {
      setUser(null);
      setStatus('signedOut');
      qc.clear();
    });

    void (async () => {
      const { access, refresh } = await tokenStore.get();
      if (!access && !refresh) {
        if (!cancelled) setStatus('signedOut');
        return;
      }
      try {
        const res = await api.get<{ data: SessionUser }>('/auth/me');
        if (cancelled) return;
        setUser(res.data.data);
        setStatus('signedIn');
        void registerDevice();
      } catch {
        if (cancelled) return;
        await tokenStore.clear();
        setStatus('signedOut');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [qc]);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const res = await api.post<{ data: AuthPayload }>('/auth/login', { identifier, password });
      await adopt(res.data.data);
    },
    [adopt],
  );

  const signUp = useCallback(
    async (input: { username: string; email: string; password: string; displayName?: string }) => {
      const res = await api.post<{ data: AuthPayload }>('/auth/signup', input);
      await adopt(res.data.data);
    },
    [adopt],
  );

  const signOut = useCallback(async () => {
    // Deregister the handset *before* the tokens go: afterwards the call has
    // no credentials and the server keeps pushing to a signed-out phone.
    const fcmToken = await unregisterDevice();
    const { refresh } = await tokenStore.get();
    try {
      await api.post('/auth/logout', { refreshToken: refresh ?? undefined, fcmToken });
    } catch {
      // Logout must not be blockable by a network failure.
    }
    await tokenStore.clear();
    qc.clear();
    setUser(null);
    setStatus('signedOut');
  }, [qc]);

  const value = useMemo<AuthValue>(
    () => ({ status, user, signIn, signUp, signOut }),
    [status, user, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth must be used inside AuthProvider');
  return v;
}
