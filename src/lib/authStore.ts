// src/lib/authStore.ts
/**
 * Tokenları localStorage’da saklamak için küçük helper.
 * - Next.js App Router'da localStorage sadece browser'da vardır.
 * - Bu yüzden bu fonksiyonlar sadece client component içinde kullanılmalı.
 */

const ACCESS_KEY = "orgmanager.accessToken";
const REFRESH_KEY = "orgmanager.refreshToken";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function saveTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}