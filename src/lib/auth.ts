// src/lib/auth.ts
// Bu dosya: auth endpointlerine özel fonksiyonları toplar.
// UI tarafı "api" fonksiyonunu direkt çağırmaz; buradan çağırır.

import { api } from "./api";

export type AuthResponse = {
  accessToken: string;
  accessExpiresAtUtc: string;
  refreshToken: string;
  refreshExpiresAtUtc: string;
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
    body: { refreshToken },
  });
}

export async function logout(refreshToken: string) {
  // backend NoContent dönüyor
  return api<void>("/api/auth/logout", {
    method: "POST",
    body: { refreshToken },
  });
}

export type MeResponse = {
  userId: string;
  email: string;
  userName: string;
};

export async function me(accessToken: string) {
  return api<MeResponse>("/api/auth/me", {
    method: "GET",
    token: accessToken,
  });
}

////