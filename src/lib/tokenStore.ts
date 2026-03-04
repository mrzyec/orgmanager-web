// src/lib/tokenStore.ts
// Basit token saklama katmanı.
// - accessToken + refreshToken localStorage'a yazılır
// - UI her yerden burayı kullanır (dağınıklık olmaz)

const ACCESS_KEY = "orgmanager_access";
const REFRESH_KEY = "orgmanager_refresh";

export function setTokens(accessToken: string, refreshToken: string) {
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