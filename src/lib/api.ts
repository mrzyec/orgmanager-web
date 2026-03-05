// src/lib/api.ts
import { getAccessToken, getRefreshToken, saveTokens } from "@/lib/authStore";

/**
 * API base URL:
 * - .env.local içine yazarsan: NEXT_PUBLIC_API_BASE_URL=http://localhost:5131
 * - yazmazsan default: http://localhost:5131
 */
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "http://localhost:5131";

/** Backend DTO'lar */
export type AuthResponseDto = {
  accessToken: string;
  refreshToken: string;
};

export type MeDto = {
  userId: string;
  email: string;
  userName: string;
};

export type OrganizationDto = {
  id: string;
  name: string;
  description?: string | null;
  taxNumber: string;
  city: string;
  district: string;
  isActive: boolean;
  createdAtUtc: string;
};

export type CreateOrganizationRequest = {
  name: string;
  description?: string | null;
  taxNumber: string;
  city: string;
  district: string;
};

export type SetActiveRequest = {
  isActive: boolean;
};

async function readBodyAsTextSafe(resp: Response) {
  try {
    return await resp.text();
  } catch {
    return null;
  }
}

function buildUrl(path: string) {
  return `${API_BASE}${path}`;
}

/**
 * ✅ 204/boş body durumlarını düzgün handle etmek için:
 * - resp.text() ile body'yi alıyoruz
 * - boşsa JSON parse etmiyoruz
 * - varsa JSON parse ediyoruz
 */
function tryParseJson<T>(text: string | null): T | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // JSON değilse undefined dönelim (bazı endpointler text dönebilir)
    return undefined;
  }
}

/**
 * Core fetch helper:
 * - accessToken varsa Authorization header ekler
 * - 401 gelirse 1 kere refresh dener (refreshManually)
 * - sonra aynı isteği tekrarlar
 */
async function fetchJson<T>(
  path: string,
  init?: RequestInit,
  options?: { auth?: boolean; retryOn401?: boolean }
): Promise<T> {
  const auth = options?.auth ?? true;
  const retryOn401 = options?.retryOn401 ?? true;

  const headers = new Headers(init?.headers || {});
  headers.set("Content-Type", "application/json");

  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const resp = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  // 401 ise: refresh + retry
  if (resp.status === 401 && auth && retryOn401) {
    const rt = getRefreshToken();
    if (rt) {
      await refreshManually(); // saveTokens yapar
      return fetchJson<T>(path, init, { auth: true, retryOn401: false });
    }
  }

  // Hata ise body'yi oku ve message'a bas
  if (!resp.ok) {
    const bodyText = await readBodyAsTextSafe(resp);
    throw new Error(
      `HTTP ${resp.status} ${resp.statusText}${bodyText ? `\n${bodyText}` : ""}`
    );
  }

  // ✅ OK: Body boş olabilir (logout gibi)
  const bodyText = await readBodyAsTextSafe(resp);
  const parsed = tryParseJson<T>(bodyText);

  // JSON yoksa undefined dön (T = void gibi durumlarda sorun olmaz)
  return parsed as T;
}

/** ---------------- AUTH ---------------- */

export async function register(
  email: string,
  password: string
): Promise<AuthResponseDto> {
  return fetchJson<AuthResponseDto>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { auth: false }
  );
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponseDto> {
  return fetchJson<AuthResponseDto>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { auth: false }
  );
}

export async function me(): Promise<MeDto> {
  return fetchJson<MeDto>("/api/auth/me", { method: "GET" }, { auth: true });
}

/**
 * logout: backend revoke bekliyor (refreshToken ile)
 * Not: Endpoint 204 dönebilir → fetchJson artık bunu kaldırıyor.
 */
export async function logout(refreshToken: string): Promise<void> {
  await fetchJson<void>(
    "/api/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    },
    { auth: false }
  );
}

export async function refreshManually(): Promise<AuthResponseDto> {
  const rt = getRefreshToken();
  if (!rt) throw new Error("Refresh token yok. Login olmalısın.");

  const res = await fetchJson<AuthResponseDto>(
    "/api/auth/refresh",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken: rt }),
    },
    { auth: false }
  );

  saveTokens(res.accessToken, res.refreshToken);
  return res;
}

/** ---------------- ORGANIZATIONS ---------------- */

export async function getOrganizations(): Promise<OrganizationDto[]> {
  return fetchJson<OrganizationDto[]>(
    "/api/organizations",
    { method: "GET" },
    { auth: true }
  );
}

export async function createOrganization(
  req: CreateOrganizationRequest
): Promise<OrganizationDto> {
  return fetchJson<OrganizationDto>(
    "/api/organizations",
    {
      method: "POST",
      body: JSON.stringify(req),
    },
    { auth: true }
  );
}

export async function setOrganizationActive(
  id: string,
  isActive: boolean
): Promise<void> {
  await fetchJson<void>(
    `/api/organizations/${id}/active`,
    {
      method: "PATCH",
      body: JSON.stringify({ isActive } as SetActiveRequest),
    },
    { auth: true }
  );
}

export async function getOrganizationById(id: string): Promise<OrganizationDto> {
  return fetchJson<OrganizationDto>(
    `/api/organizations/${id}`,
    { method: "GET" },
    { auth: true }
  );
}