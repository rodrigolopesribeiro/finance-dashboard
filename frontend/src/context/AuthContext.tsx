import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AuthUser } from '../services/auth';
import { getMe, login as loginRequest, refreshSession as refreshRequest, register as registerRequest } from '../services/auth';
import { setRefreshHandler } from '../services/api';
import {
  clearAuthStorage,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  setStoredUser,
  setTokens,
} from '../services/tokenStorage';

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (user: AuthUser) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser<AuthUser>());
  const [accessToken, setAccessToken] = useState<string | null>(() => getAccessToken());
  const [initializing, setInitializing] = useState(true);
  const refreshPromise = useRef<Promise<string | null> | null>(null);

  const updateUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    setStoredUser(nextUser);
  }, []);

  const applyAuthResponse = useCallback((data: { user: AuthUser; accessToken: string; refreshToken: string }) => {
    setUser(data.user);
    setAccessToken(data.accessToken);
    setStoredUser(data.user);
    setTokens(data.accessToken, data.refreshToken);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    clearAuthStorage();
  }, []);

  const refreshSession = useCallback(async () => {
    if (refreshPromise.current) return refreshPromise.current;
    const token = getRefreshToken();
    if (!token) return null;

    refreshPromise.current = refreshRequest(token)
      .then((data) => {
        applyAuthResponse(data);
        return data.accessToken;
      })
      .catch(() => {
        logout();
        return null;
      })
      .finally(() => {
        refreshPromise.current = null;
      });

    return refreshPromise.current;
  }, [applyAuthResponse, logout]);

  useEffect(() => {
    setRefreshHandler(() => refreshSession());
    return () => setRefreshHandler(null);
  }, [refreshSession]);

  useEffect(() => {
    const bootstrap = async () => {
      const storedUser = getStoredUser<AuthUser>();
      const storedAccess = getAccessToken();

      if (storedAccess) {
        setAccessToken(storedAccess);
        if (storedUser) {
          setUser(storedUser);
        } else {
          try {
            const me = await getMe();
            setUser(me);
            setStoredUser(me);
          } catch {
            if (getRefreshToken()) {
              await refreshSession();
            }
          }
        }
        setInitializing(false);
        return;
      }

      if (getRefreshToken()) {
        await refreshSession();
      }
      setInitializing(false);
    };

    bootstrap();
  }, [refreshSession]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginRequest(email, password);
    applyAuthResponse(data);
  }, [applyAuthResponse]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await registerRequest(name, email, password);
    applyAuthResponse(data);
  }, [applyAuthResponse]);

  const value = useMemo(
    () => ({ user, accessToken, initializing, login, register, updateUser, logout }),
    [user, accessToken, initializing, login, register, updateUser, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
