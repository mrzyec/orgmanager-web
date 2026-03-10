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

export type UpdateOrganizationRequest = {
  name: string;
  taxNumber: string;
  city: string;
  district: string;
  description: string | null;
};

export async function updateOrganizationSettings(
  organizationId: string,
  request: UpdateOrganizationRequest
): Promise<void> {
  await apiFetch<void>(`/api/organizations/${organizationId}`, {
    method: "PUT",
    body: JSON.stringify(request),
  });
}