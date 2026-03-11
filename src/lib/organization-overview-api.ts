const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://localhost:5131";

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
      message =
        errorData?.message ||
        errorData?.title ||
        errorData?.error ||
        (typeof errorData === "string" ? errorData : message);
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

type OrganizationJoinRequestDto = {
  status: string;
};

type OrganizationPaymentSettingsDto = {
  isEnabled: boolean;
  period?: "Monthly" | "Yearly" | null;
  amount?: number | null;
  currency?: string | null;
};

type OrganizationMemberPaymentStatusDto = {
  isOverdue: boolean;
};

export type OrganizationOverviewSummaryDto = {
  pendingRequestCount: number;
  paymentEnabled: boolean;
  overdueCount: number;
  paymentPeriod: "Monthly" | "Yearly" | null;
  paymentAmount: number | null;
  paymentCurrency: string | null;
  unpaidDebtTotalAmount: number | null;
};

export async function getOrganizationOverviewSummary(
  organizationId: string
): Promise<OrganizationOverviewSummaryDto> {
  const [joinRequests, paymentSettings, paymentStatuses] = await Promise.all([
    apiFetch<OrganizationJoinRequestDto[]>(
      `/api/organizations/${organizationId}/join-requests`
    ).catch(() => []),
    apiFetch<OrganizationPaymentSettingsDto>(
      `/api/organizations/${organizationId}/payments/settings`
    ).catch(() => ({
      isEnabled: false,
      period: null,
      amount: null,
      currency: null,
    })),
    apiFetch<OrganizationMemberPaymentStatusDto[]>(
      `/api/organizations/${organizationId}/payments/members`
    ).catch(() => []),
  ]);

  const pendingRequestCount = joinRequests.filter(
    (x) => x.status === "Pending"
  ).length;

  const overdueCount = paymentStatuses.filter((x) => x.isOverdue).length;

  const paymentAmount =
    typeof paymentSettings.amount === "number" ? paymentSettings.amount : null;

  const unpaidDebtTotalAmount =
    paymentSettings.isEnabled && paymentAmount !== null
      ? overdueCount * paymentAmount
      : null;

  return {
    pendingRequestCount,
    paymentEnabled: !!paymentSettings.isEnabled,
    overdueCount,
    paymentPeriod: paymentSettings.period ?? null,
    paymentAmount,
    paymentCurrency: paymentSettings.currency ?? null,
    unpaidDebtTotalAmount,
  };
}