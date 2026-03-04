// src/lib/authStore.ts
// Tokenları localStorage'da saklayan mini katman.
// UI veya API katmanı tokena ihtiyaç duyduğunda buradan okur.

const ACCESS_KEY = "orgmanager_access";
const REFRESH_KEY = "orgmanager_refresh";

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}