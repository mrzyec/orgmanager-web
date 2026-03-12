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
  joinCode?: string | null;
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

export type OrganizationJoinRequestDto = {
  id: string;
  organizationId: string;
  organizationName: string;
  userId: string;
  userEmail: string;
  status: string;
  createdAtUtc: string;
  reviewedAtUtc?: string | null;
  reviewedByUserId?: string | null;
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

export type PaymentMethod = "Cash" | "BankTransfer" | "Card" | "Other";

export type OrganizationPaymentSettingsDto = {
  id: string;
  organizationId: string;
  isEnabled: boolean;
  period: "Monthly" | "Yearly";
  amount: number | null;
  currency: string | null;
  startDateUtc: string | null;
  version: number;
  createdAtUtc: string;
  updatedAtUtc?: string | null;
};

export type UpsertOrganizationPaymentSettingsRequest = {
  isEnabled: boolean;
  period: "Monthly" | "Yearly";
  amount: number | null;
  currency: string | null;
  startDateUtc: string | null;
};

export type OrganizationPaymentPlanRevisionDto = {
  id: string;
  organizationPaymentPlanId: string;
  organizationId: string;
  year: number;
  period: "Monthly" | "Yearly" | string;
  revisionNo: number;
  effectiveFromUtc: string;
  amount: number;
  currency: string;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
};

export type OrganizationPaymentPlanDto = {
  id: string;
  organizationId: string;
  year: number;
  period: "Monthly" | "Yearly";
  amount: number;
  currency: string;
  isActive: boolean;
  createdAtUtc: string;
  updatedAtUtc: string;
  revisions: OrganizationPaymentPlanRevisionDto[];
};

export type UpsertOrganizationPaymentPlanRequest = {
  period: "Monthly" | "Yearly";
  amount: number;
  currency: string;
  isActive: boolean;
};

export type AddOrganizationPaymentPlanRevisionRequest = {
  effectiveFromUtc: string;
  amount: number;
  currency: string;
  isActive: boolean;
};

export type OrganizationMemberPaymentStatusDto = {
  organizationMemberId: string;
  userId: string;
  email: string;
  role: string;
  isMemberActive: boolean;
  lastPaidAtUtc?: string | null;
  nextDueDateUtc?: string | null;
  currentPeriodPaidAmount: number;
  isOverdue: boolean;
  overdueSinceUtc?: string | null;
  totalOutstandingAmount: number;
  overduePeriodCount: number;
};

export type OrganizationMemberPaymentPeriodDto = {
  id: string;
  periodYear: number;
  periodMonth?: number | null;
  periodLabel: string;
  periodStartUtc: string;
  periodType: "Monthly" | "Yearly" | string;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  status: "Pending" | "Partial" | "Paid" | string;
  isOverdue: boolean;
  isCurrentPeriod: boolean;
  paymentCount: number;
  lastPaidAtUtc?: string | null;
};

export type PayOrganizationMemberPeriodRequest = {
  amount: number;
  paidAtUtc: string;
  paymentMethod: PaymentMethod;
  note?: string | null;
};

export type RecentOrganizationMemberPaymentDto = {
  paymentId: string;
  organizationMemberId: string;
  userId: string;
  email: string;
  role: string;
  isMemberActive: boolean;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod | string;
  periodYear: number;
  periodMonth?: number | null;
  periodLabel: string;
  paidAtUtc: string;
  markedByUserId: string;
  markedByEmail: string;
  paymentSettingsVersion: number;
  settingsAmountSnapshot: number;
  note?: string | null;
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
export type VerifyEmailResponse = {
  success?: boolean;
  message?: string;
};

export type ResendVerificationEmailRequest = {
  email: string;
};

export async function resendVerificationEmail(
  body: ResendVerificationEmailRequest
): Promise<VerifyEmailResponse> {
  return request<VerifyEmailResponse>(
    "/api/auth/resend-verification-email",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    false
  );
}

export async function verifyEmail(
  email: string,
  token: string
): Promise<VerifyEmailResponse> {
  const params = new URLSearchParams({
    email,
    token,
  });

  return request<VerifyEmailResponse>(
    `/api/auth/verify-email?${params.toString()}`,
    {
      method: "GET",
    },
    false
  );
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

export async function regenerateOrganizationJoinCode(
  id: string
): Promise<OrganizationDto> {
  return request<OrganizationDto>(
    `/api/organizations/${id}/regenerate-join-code`,
    {
      method: "POST",
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

export async function createOrganizationJoinRequest(
  joinCode: string
): Promise<OrganizationJoinRequestDto> {
  return request<OrganizationJoinRequestDto>(
    "/api/organization-join-requests",
    {
      method: "POST",
      body: JSON.stringify({ joinCode }),
    },
    true
  );
}

export async function getMyOrganizationJoinRequests(): Promise<OrganizationJoinRequestDto[]> {
  return request<OrganizationJoinRequestDto[]>(
    "/api/organization-join-requests/mine",
    { method: "GET" },
    true
  );
}

export async function getOrganizationJoinRequests(
  organizationId: string
): Promise<OrganizationJoinRequestDto[]> {
  return request<OrganizationJoinRequestDto[]>(
    `/api/organization-join-requests/organization/${organizationId}`,
    { method: "GET" },
    true
  );
}

export async function reviewOrganizationJoinRequest(
  requestId: string,
  approve: boolean
): Promise<void> {
  await request<null>(
    `/api/organization-join-requests/${requestId}/review`,
    {
      method: "POST",
      body: JSON.stringify({ approve }),
    },
    true
  );
}

export async function cancelOrganizationJoinRequest(
  requestId: string
): Promise<void> {
  await request<null>(
    `/api/organization-join-requests/${requestId}/cancel`,
    {
      method: "DELETE",
    },
    true
  );
}

export async function getOrganizationPaymentSettings(
  organizationId: string
): Promise<OrganizationPaymentSettingsDto> {
  return request<OrganizationPaymentSettingsDto>(
    `/api/organizations/${organizationId}/payments/settings`,
    { method: "GET" },
    true
  );
}

export async function upsertOrganizationPaymentSettings(
  organizationId: string,
  body: UpsertOrganizationPaymentSettingsRequest
): Promise<OrganizationPaymentSettingsDto> {
  return request<OrganizationPaymentSettingsDto>(
    `/api/organizations/${organizationId}/payments/settings`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
    true
  );
}

export async function getOrganizationPaymentPlans(
  organizationId: string
): Promise<OrganizationPaymentPlanDto[]> {
  return request<OrganizationPaymentPlanDto[]>(
    `/api/organizations/${organizationId}/payments/plans`,
    { method: "GET" },
    true
  );
}

export async function upsertOrganizationPaymentPlan(
  organizationId: string,
  year: number,
  body: UpsertOrganizationPaymentPlanRequest
): Promise<OrganizationPaymentPlanDto> {
  return request<OrganizationPaymentPlanDto>(
    `/api/organizations/${organizationId}/payments/plans/${year}`,
    {
      method: "PUT",
      body: JSON.stringify(body),
    },
    true
  );
}

export async function addOrganizationPaymentPlanRevision(
  organizationId: string,
  year: number,
  body: AddOrganizationPaymentPlanRevisionRequest
): Promise<OrganizationPaymentPlanDto> {
  return request<OrganizationPaymentPlanDto>(
    `/api/organizations/${organizationId}/payments/plans/${year}/revisions`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    true
  );
}

export async function deleteOrganizationPaymentPlan(
  organizationId: string,
  year: number
): Promise<void> {
  await request<null>(
    `/api/organizations/${organizationId}/payments/plans/${year}`,
    {
      method: "DELETE",
    },
    true
  );
}

export async function getOrganizationMemberPaymentStatuses(
  organizationId: string
): Promise<OrganizationMemberPaymentStatusDto[]> {
  return request<OrganizationMemberPaymentStatusDto[]>(
    `/api/organizations/${organizationId}/payments/members`,
    { method: "GET" },
    true
  );
}

export async function getOrganizationMemberPaymentPeriods(
  organizationId: string,
  organizationMemberId: string,
  options?: { year?: number; onlyOpen?: boolean }
): Promise<OrganizationMemberPaymentPeriodDto[]> {
  const params = new URLSearchParams();

  if (typeof options?.year === "number") {
    params.set("year", String(options.year));
  }

  if (typeof options?.onlyOpen === "boolean") {
    params.set("onlyOpen", String(options.onlyOpen));
  }

  const query = params.toString();
  const suffix = query ? `?${query}` : "";

  return request<OrganizationMemberPaymentPeriodDto[]>(
    `/api/organizations/${organizationId}/payments/members/${organizationMemberId}/periods${suffix}`,
    { method: "GET" },
    true
  );
}

export async function payOrganizationMemberPeriod(
  organizationId: string,
  organizationMemberId: string,
  periodId: string,
  body: PayOrganizationMemberPeriodRequest
): Promise<unknown> {
  return request<unknown>(
    `/api/organizations/${organizationId}/payments/members/${organizationMemberId}/periods/${periodId}/pay`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    true
  );
}

export async function getRecentOrganizationPayments(
  organizationId: string,
  count: number = 10
): Promise<RecentOrganizationMemberPaymentDto[]> {
  return request<RecentOrganizationMemberPaymentDto[]>(
    `/api/organizations/${organizationId}/payments/recent?count=${count}`,
    { method: "GET" },
    true
  );
}