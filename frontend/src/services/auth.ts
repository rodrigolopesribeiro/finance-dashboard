import { apiRequest } from './api';
import { getRefreshToken } from './tokenStorage';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

export type AuthResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};

export type UpdateProfilePayload = {
  name?: string;
  email?: string;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export async function login(email: string, password: string) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
    skipAuthRefresh: true,
  });
}

export async function register(name: string, email: string, password: string) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
    skipAuth: true,
    skipAuthRefresh: true,
  });
}

export async function refreshSession(refreshToken?: string) {
  const token = refreshToken || getRefreshToken();
  if (!token) {
    throw new Error('Refresh token ausente');
  }

  return apiRequest<AuthResponse>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token }),
    skipAuth: true,
    skipAuthRefresh: true,
  });
}

export async function getMe() {
  return apiRequest<AuthUser>('/users/me');
}

export async function updateMe(payload: UpdateProfilePayload) {
  return apiRequest<AuthUser>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function changePassword(payload: ChangePasswordPayload) {
  return apiRequest<{ message: string }>('/users/me/password', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}
