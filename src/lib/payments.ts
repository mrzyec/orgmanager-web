const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://localhost:5131";

export type PaymentPeriod = "Monthly" | "Yearly";

export type OrganizationPaymentSettingsDto = {
  id?: string;
  organizationId?: string;
  isEnabled: boolean;
  period: PaymentPeriod;
  amount: number | null;
  currency: string | null;
  startDateUtc: string | null;
  createdAtUtc?: string | null;
  updatedAtUtc?: string | null;
};

export type UpdateOrganizationPaymentSettingsRequest = {
  isEnabled: boolean;
  period: PaymentPeriod;
  amount: number | null;
  currency: string | null;
  startDateUtc: string | null;
};

export type OrganizationMemberPaymentStatusDto = {
  organizationMemberId: string;
  userId: string;
  email: string;
  role: string;
  isMemberActive: boolean;
  lastPaidAtUtc: string | null;
  nextDueDateUtc: string | null;
  isOverdue: boolean;
  overdueSinceUtc: string | null;
};

export type MarkMemberPaidRequest = {
  paidAtUtc?: string | null;
};

type ApiError = Error & {
  status?: number;
};

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;

  const possibleKeys = [
    "accessToken",
    "token",
    "authToken",
    "jwt",
    "orgmanager_access_token",
  ];

  for (const key of possibleKeys) {
    const value = window.localStorage.getItem(key);
    if (value) return value;
  }

  return null;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    let message = "İstek başarısız oldu.";

    try {
      const errorData = await response.json();

      if (errorData?.errors) {
        const firstErrorKey = Object.keys(errorData.errors)[0];
        const firstErrorMessage =
          firstErrorKey && Array.isArray(errorData.errors[firstErrorKey])
            ? errorData.errors[firstErrorKey][0]
            : null;

        message =
          firstErrorMessage ||
          errorData?.message ||
          errorData?.title ||
          errorData?.error ||
          message;
      } else {
        message =
          errorData?.message ||
          errorData?.title ||
          errorData?.error ||
          (typeof errorData === "string" ? errorData : message);
      }
    } catch {
      try {
        const text = await response.text();
        if (text) message = text;
      } catch {
        // ignore
      }
    }

    const error = new Error(message) as ApiError;
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function getOrganizationPaymentSettings(
  organizationId: string
): Promise<OrganizationPaymentSettingsDto> {
  return await apiFetch<OrganizationPaymentSettingsDto>(
    `/api/organizations/${organizationId}/payments/settings`
  );
}

export async function updateOrganizationPaymentSettings(
  organizationId: string,
  request: UpdateOrganizationPaymentSettingsRequest
): Promise<OrganizationPaymentSettingsDto> {
  return apiFetch<OrganizationPaymentSettingsDto>(
    `/api/organizations/${organizationId}/payments/settings`,
    {
      method: "PUT",
      body: JSON.stringify(request),
    }
  );
}

export async function getOrganizationMemberPaymentStatuses(
  organizationId: string
): Promise<OrganizationMemberPaymentStatusDto[]> {
  return await apiFetch<OrganizationMemberPaymentStatusDto[]>(
    `/api/organizations/${organizationId}/payments/members`
  );
}

export async function markOrganizationMemberPaid(
  organizationId: string,
  organizationMemberId: string,
  request?: MarkMemberPaidRequest
): Promise<OrganizationMemberPaymentStatusDto> {
  return apiFetch<OrganizationMemberPaymentStatusDto>(
    `/api/organizations/${organizationId}/payments/members/${organizationMemberId}/mark-paid`,
    {
      method: "POST",
      body: JSON.stringify(request ?? {}),
    }
  );
}