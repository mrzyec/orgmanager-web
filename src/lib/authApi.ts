// src/lib/authApi.ts
// Auth endpointlerini tek bir yerde topluyoruz.
// UI, fetch ile uğraşmasın -> buradan çağıracak.

import { api } from "./apiClient";

export type AuthResponse = {
  accessToken: string;
  accessExpiresAtUtc: string;
  refreshToken: string;
  refreshExpiresAtUtc: string;
};

export type MeResponse = {
  userId: string;
  email: string;
  userName: string;
};

export async function register(email: string, password: string) {
  return api<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: { email, password },
  });
}

export async function login(email: string, password: string) {
  return api<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export async function refresh(refreshToken: string) {
  return api<AuthResponse>("/api/auth/refresh", {
    method: "POST",
    body: { refreshToken }, // backend DTO: RefreshToken
  });
}

export async function logout(refreshToken: string) {
  return api<void>("/api/auth/logout", {
    method: "POST",
    body: { refreshToken },
  });
}

export async function me(accessToken: string) {
  return api<MeResponse>("/api/auth/me", {
    method: "GET",
    token: accessToken,
  });
}