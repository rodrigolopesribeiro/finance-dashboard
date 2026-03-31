import { getAccessToken } from './tokenStorage';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api';

type ApiRequestOptions = RequestInit & {
  skipAuth?: boolean;
  skipAuthRefresh?: boolean;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: any;
};

type RefreshHandler = () => Promise<string | null>;

let refreshHandler: RefreshHandler | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setRefreshHandler(handler: RefreshHandler | null) {
  refreshHandler = handler;
}

function getErrorMessage(error: any) {
  if (!error) return 'Erro inesperado';
  if (typeof error === 'string') return error;
  if (typeof error?.message === 'string') return error.message;
  if (Array.isArray(error?.message)) return error.message.join(', ');
  return 'Erro inesperado';
}

async function request<T>(path: string, options: ApiRequestOptions, retry = true) {
  const { skipAuth, skipAuthRefresh, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers || {}),
  } as Record<string, string>;

  if (!skipAuth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (
    response.status === 401 &&
    retry &&
    !skipAuthRefresh &&
    refreshHandler &&
    !path.startsWith('/auth/')
  ) {
    if (!refreshPromise) {
      refreshPromise = refreshHandler().finally(() => {
        refreshPromise = null;
      });
    }
    const newToken = await refreshPromise;
    if (newToken) {
      return request<T>(path, options, false);
    }
  }

  const json: ApiResponse<T> = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(getErrorMessage(json.error));
  }

  return json.data;
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}) {
  return request<T>(path, options, true);
}

export function getApiUrl() {
  return API_URL;
}
