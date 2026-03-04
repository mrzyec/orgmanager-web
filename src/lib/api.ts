/**
 * api.ts
 * ------
 * Amaç: Backend endpoint'lerine tek yerden erişmek.
 * - baseUrl: API'nin adresi
 * - fetchJson: JSON request/response helper
 * - auth endpointleri: register/login/refresh/logout/me
 * - organizations endpointleri: list/create/toggle active
 *
 * Not: Şu an backend: http://localhost:5131
 * Next.js dev: http://localhost:3000
 */

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5131";

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

export type OrganizationDto = {
  id: string;
  name: string;
  description: string | null;
  taxNumber: string;
  city: string;
  district: string;
  isActive: boolean;
  createdAtUtc: string;
};

type CreateOrganizationRequest = {
  name: string;
  taxNumber: string;
  city: string;
  district: string;
  description?: string | null;
};

/**
 * fetchJson:
 * - url'e istek atar
 * - JSON response bekler
 * - hata durumunda backend'in döndüğü "error" alanını yakalar ve throw eder
 */
async function fetchJson<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  // Başarılı değilse hata gövdesini okumaya çalış
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      // ExceptionHandlingMiddleware: { error: "...", type: "...", ... }
      if (body?.error) msg = body.error;
      else if (body?.title) msg = body.title; // model validation vb.
    } catch {
      // JSON değilse ignore
    }
    throw new Error(msg);
  }

  // 204 NoContent gibi durumlarda JSON yoktur
  if (res.status === 204) return undefined as T;

  return (await res.json()) as T;
}

/**
 * Authorization header helper
 * Bearer token gönderiyoruz.
 */
function authHeader(accessToken: string) {
  return { Authorization: `Bearer ${accessToken}` };
}

// =====================
// AUTH
// =====================

export function register(email: string, password: string) {
  return fetchJson<AuthResponse>(`${API_BASE}/api/auth/register`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function login(email: string, password: string) {
  return fetchJson<AuthResponse>(`${API_BASE}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function refresh(refreshToken: string) {
  // Backend: record RefreshRequest(string RefreshToken)
  // JSON alan adı: refreshToken (camelCase) göndermek sorun değil;
  // ama istersen C# tarafında RefreshToken olduğu için pascal da gönderebilirsin.
  return fetchJson<AuthResponse>(`${API_BASE}/api/auth/refresh`, {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function logout(refreshToken: string) {
  return fetchJson<void>(`${API_BASE}/api/auth/logout`, {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function me(accessToken: string) {
  return fetchJson<MeResponse>(`${API_BASE}/api/auth/me`, {
    method: "GET",
    headers: authHeader(accessToken),
  });
}

// =====================
// ORGANIZATIONS
// =====================

export function getOrganizations(accessToken: string) {
  return fetchJson<OrganizationDto[]>(`${API_BASE}/api/organizations`, {
    method: "GET",
    headers: authHeader(accessToken),
  });
}

export function createOrganization(
  accessToken: string,
  req: CreateOrganizationRequest
) {
  return fetchJson<OrganizationDto>(`${API_BASE}/api/organizations`, {
    method: "POST",
    headers: authHeader(accessToken),
    body: JSON.stringify(req),
  });
}

export function setOrganizationActive(
  accessToken: string,
  id: string,
  isActive: boolean
) {
  return fetchJson<void>(`${API_BASE}/api/organizations/${id}/active`, {
    method: "PATCH",
    headers: authHeader(accessToken),
    body: JSON.stringify({ isActive }),
  });
}