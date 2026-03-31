const STORAGE_USER = 'auth_user';
const STORAGE_ACCESS = 'accessToken';
const STORAGE_REFRESH = 'refreshToken';

const safeStorageGet = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors
  }
};

const safeStorageRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore storage errors
  }
};

export function getAccessToken() {
  return safeStorageGet(STORAGE_ACCESS);
}

export function getRefreshToken() {
  return safeStorageGet(STORAGE_REFRESH);
}

export function getStoredUser<T>() {
  const raw = safeStorageGet(STORAGE_USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    safeStorageRemove(STORAGE_USER);
    return null;
  }
}

export function setStoredUser(user: unknown) {
  safeStorageSet(STORAGE_USER, JSON.stringify(user));
}

export function setTokens(accessToken: string, refreshToken?: string) {
  safeStorageSet(STORAGE_ACCESS, accessToken);
  if (refreshToken) safeStorageSet(STORAGE_REFRESH, refreshToken);
}

export function clearTokens() {
  safeStorageRemove(STORAGE_ACCESS);
  safeStorageRemove(STORAGE_REFRESH);
}

export function clearStoredUser() {
  safeStorageRemove(STORAGE_USER);
}

export function clearAuthStorage() {
  clearTokens();
  clearStoredUser();
}
