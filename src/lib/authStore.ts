/**
 * authStore.ts
 * -------------
 * Amaç: Access/Refresh token'ları browser'da saklamak ve okumak.
 * Şimdilik localStorage kullanıyoruz (kolay).
 * İleride cookie/secure storage gibi yöntemlere geçebiliriz.
 */

const ACCESS_KEY = "orgmanager_access";
const REFRESH_KEY = "orgmanager_refresh";

export function saveTokens(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}