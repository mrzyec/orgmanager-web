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
  accessExpiresAtUtc?: string;
  refreshExpiresAtUtc?: string;
};

export type MeResponse = {
  userId: string;
  email: string;
  userName?: string | null;
  roles?: string[];
};

export type OrganizationDto = {
  id: string;
  name: string;
  description?: string | null;
  taxNumber?: string | null;
  city?: string | null;
  district?: string | null;
  ownerUserId?: string | null;
  isActive?: boolean;
  paymentPeriod?: "Monthly" | "Yearly" | string | null;
  createdAtUtc?: string | null;
};

export type OrganizationMemberDto = {
  id: string;
  organizationId: string;
  userId: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAtUtc: string;
};

export type AddOrganizationMemberRequest = {
  email: string;
  role: "Member" | "Assistant";
};

export type UpdateOrganizationMemberRequest = {
  role: "Member" | "Assistant";
  isActive: boolean;
};

export type CreateOrganizationRequest = {
  name: string;
  description?: string;
  taxNumber?: string;
  city?: string;
  district?: string;
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

function buildFriendlyErrorMessage(status: number, data: unknown): string {
  if (typeof data === "string" && data.trim() !== "") {
    return data;
  }

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (typeof obj.error === "string" && obj.error.trim() !== "") {
      return obj.error;
    }

    if (typeof obj.message === "string" && obj.message.trim() !== "") {
      return obj.message;
    }

    if (typeof obj.detail === "string" && obj.detail.trim() !== "") {
      return obj.detail;
    }

    if (Array.isArray(obj.errors) && obj.errors.length > 0) {
      const first = obj.errors[0];
      if (typeof first === "string") return first;
    }
  }

  if (status === 400) return "İstek işlenemedi. Gönderdiğin bilgileri kontrol et.";
  if (status === 401) return "Oturumun geçersiz veya süresi dolmuş. Lütfen tekrar giriş yap.";
  if (status === 403) return "Bu işlem için yetkin bulunmuyor.";
  if (status === 404) return "Aradığın kayıt bulunamadı.";
  if (status === 409) return "Bu işlem mevcut durumla çakışıyor.";
  if (status >= 500) return "Sunucu tarafında bir hata oluştu. Lütfen tekrar dene.";

  return "Bir hata oluştu.";
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
    throw new Error(buildFriendlyErrorMessage(response.status, data));
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
  const refreshToken = getRefreshToken();

  try {
    await request<null>(
      "/api/auth/logout",
      {
        method: "POST",
        body: JSON.stringify({
          refreshToken: refreshToken ?? "",
        }),
      },
      false
    );
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

export async function createOrganization(
  body: CreateOrganizationRequest
): Promise<OrganizationDto> {
  return request<OrganizationDto>(
    "/api/organizations",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    true
  );
}

export async function setOrganizationActive(
  id: string,
  isActive: boolean
): Promise<void> {
  await request<null>(
    `/api/organizations/${id}/active`,
    {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    },
    true
  );
}

export async function getOrganizationMembers(
  organizationId: string
): Promise<OrganizationMemberDto[]> {
  return request<OrganizationMemberDto[]>(
    `/api/organizations/${organizationId}/members`,
    { method: "GET" },
    true
  );
}

export async function addOrganizationMember(
  organizationId: string,
  body: AddOrganizationMemberRequest
): Promise<OrganizationMemberDto> {
  return request<OrganizationMemberDto>(
    `/api/organizations/${organizationId}/members`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    true
  );
}

export async function updateOrganizationMember(
  organizationId: string,
  memberId: string,
  body: UpdateOrganizationMemberRequest
): Promise<OrganizationMemberDto> {
  return request<OrganizationMemberDto>(
    `/api/organizations/${organizationId}/members/${memberId}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
    true
  );
}

export async function deleteOrganizationMember(
  organizationId: string,
  memberId: string
): Promise<void> {
  await request<null>(
    `/api/organizations/${organizationId}/members/${memberId}`,
    {
      method: "DELETE",
    },
    true
  );
}

export async function transferOrganizationOwnership(
  organizationId: string,
  newOwnerUserId: string
): Promise<void> {
  await request<null>(
    `/api/organizations/${organizationId}/members/transfer-ownership`,
    {
      method: "POST",
      body: JSON.stringify({ newOwnerUserId }),
    },
    true
  );
}