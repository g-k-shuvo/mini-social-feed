/**
 * The HTTP client and the token lifecycle that sits on top of it.
 *
 * The interesting part is the refresh interceptor. When an access token
 * expires, several queries usually fail at once — feed, unread count, profile.
 * A naive interceptor fires one refresh per failure, and because refresh
 * *rotates*, the second one replays a token the first already spent, which the
 * API correctly treats as theft and revokes the whole family. The user gets
 * logged out for doing nothing wrong.
 *
 * So: one in-flight refresh promise, shared. Everyone waits on it and replays.
 */
import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

export const API_URL: string =
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  'http://10.0.2.2:4000/api/v1';

const ACCESS_KEY = 'access-token';
const REFRESH_KEY = 'refresh-token';

export interface ApiErrorShape {
  code: string;
  message: string;
  details?: { field: string; issue: string }[];
  requestId?: string;
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: { field: string; issue: string }[];

  constructor(status: number, body: ApiErrorShape) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.status = status;
    this.details = body.details;
  }
}

export const tokenStore = {
  get: () =>
    Promise.all([
      SecureStore.getItemAsync(ACCESS_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]).then(([access, refresh]) => ({ access, refresh })),

  set: async (access: string, refresh: string) => {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, access),
      SecureStore.setItemAsync(REFRESH_KEY, refresh),
    ]);
  },

  clear: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};

let onSessionLost: (() => void) | null = null;
export function setSessionLostHandler(fn: () => void) {
  onSessionLost = fn;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const { access } = await tokenStore.get();
  if (access) config.headers.Authorization = `Bearer ${access}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function runRefresh(): Promise<string | null> {
  const { refresh } = await tokenStore.get();
  if (!refresh) return null;
  try {
    // A bare axios call, not `api`: going back through the interceptor here
    // would recurse the moment the refresh itself 401s.
    const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh }, {
      timeout: 20_000,
    });
    const { accessToken, refreshToken } = res.data.data as {
      accessToken: string;
      refreshToken: string;
    };
    await tokenStore.set(accessToken, refreshToken);
    return accessToken;
  } catch {
    await tokenStore.clear();
    onSessionLost?.();
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError<{ error?: ApiErrorShape }>) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    const status = error.response?.status;
    const body = error.response?.data?.error;

    const isAuthCall = original?.url?.includes('/auth/');

    if (status === 401 && original && !original._retried && !isAuthCall) {
      original._retried = true;
      refreshing ??= runRefresh().finally(() => {
        refreshing = null;
      });
      const fresh = await refreshing;
      if (fresh) {
        original.headers.Authorization = `Bearer ${fresh}`;
        return api.request(original);
      }
    }

    if (body) throw new ApiError(status ?? 0, body);

    // No response at all: the phone is offline or the server is unreachable.
    // Those read differently to a user, so they get different messages.
    throw new ApiError(status ?? 0, {
      code: error.code === 'ECONNABORTED' ? 'TIMEOUT' : 'NETWORK',
      message:
        error.code === 'ECONNABORTED'
          ? 'That took too long. The server may be waking up — try again.'
          : "Can't reach the server. Check your connection.",
    });
  },
);
