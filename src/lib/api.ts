// src/lib/api.ts

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5131";

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  expiresAtUtc?: string;
};

export type MeResponse = {
  id: string;
  email: string;
};

export type OrganizationDto = {
  id: string;
  name: string;
  description?: string | null;
  paymentPeriod?: "Monthly" | "Yearly" | string;
  createdAtUtc?: string;
};

const ACCESS_TOKEN_KEY = "orgmanager_access_token";
const REFRESH_TOKEN_KEY = "orgmanager_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function parseResponse(response: Response) {
  if (response.status === 204) {
    return null;
  }

  const text = await response.text();

  if (!text || text.trim() === "") {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
  requiresAuth: boolean = false
): Promise<T> {
  const headers = new Headers(options?.headers ?? {});
  headers.set("Content-Type", "application/json");

  if (requiresAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await parseResponse(response);

  if (!response.ok) {
    let message = "Bir hata oluştu.";

    if (typeof data === "string" && data.trim() !== "") {
      message = data;
    } else if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;

      if (typeof obj.title === "string" && obj.title.trim() !== "") {
        message = obj.title;
      } else if (typeof obj.message === "string" && obj.message.trim() !== "") {
        message = obj.message;
      } else if (typeof obj.detail === "string" && obj.detail.trim() !== "") {
        message = obj.detail;
      }
    }

    throw new Error(message);
  }

  return data as T;
}

export async function login(requestBody: LoginRequest): Promise<LoginResponse> {
  const result = await request<LoginResponse>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify(requestBody),
    },
    false
  );

  if (result?.accessToken && result?.refreshToken) {
    setTokens(result.accessToken, result.refreshToken);
  }

  return result;
}

export async function register(
  requestBody: RegisterRequest
): Promise<LoginResponse | null> {
  const result = await request<LoginResponse | null>(
    "/api/auth/register",
    {
      method: "POST",
      body: JSON.stringify(requestBody),
    },
    false
  );

  if (result?.accessToken && result?.refreshToken) {
    setTokens(result.accessToken, result.refreshToken);
  }

  return result;
}

export async function getMe(): Promise<MeResponse> {
  return request<MeResponse>("/api/auth/me", { method: "GET" }, true);
}

export async function logout(): Promise<void> {
  try {
    await request<null>("/api/auth/logout", { method: "POST" }, true);
  } finally {
    clearTokens();
  }
}

export async function getOrganizations(): Promise<OrganizationDto[]> {
  return request<OrganizationDto[]>("/api/organizations", { method: "GET" }, true);
}

export async function getOrganizationById(id: string): Promise<OrganizationDto> {
  return request<OrganizationDto>(
    `/api/organizations/${id}`,
    { method: "GET" },
    true
  );
}

export async function createOrganization(body: {
  name: string;
  description?: string;
}): Promise<OrganizationDto> {
  return request<OrganizationDto>(
    "/api/organizations",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    true
  );
}