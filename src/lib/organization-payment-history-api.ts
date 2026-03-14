import { apiFetch } from "./api";

export type OrganizationPaymentHistoryStatus = "Completed" | "Cancelled";

export type OrganizationPaymentHistoryItemDto = {
  paymentId: string;
  memberId: string;
  memberDisplayName: string;
  email: string;
  periodLabel: string;
  amount: number;
  currency: string;
  paidAtUtc: string;
  markedByDisplayName: string;
  note: string | null;
  paymentMethod: string;
  status: OrganizationPaymentHistoryStatus;
  cancelledAtUtc: string | null;
  cancelledByDisplayName: string | null;
  cancellationType: string | null;
  cancellationReasonCode: string | null;
  cancellationNote: string | null;
};

export type OrganizationPaymentHistoryResponseDto = {
  items: OrganizationPaymentHistoryItemDto[];
  totalCount: number;
  page: number;
  pageSize: number;
};

export type GetOrganizationPaymentHistoryParams = {
  page?: number;
  pageSize?: number;
  search?: string;
  year?: number;
  month?: number;
  day?: number;
  status?: "all" | "completed" | "cancelled";
  includeCancelled?: boolean;
};

function buildQuery(params: GetOrganizationPaymentHistoryParams) {
  const query = new URLSearchParams();

  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.year) query.set("year", String(params.year));
  if (params.month) query.set("month", String(params.month));
  if (params.day) query.set("day", String(params.day));
  if (params.status && params.status !== "all") query.set("status", params.status);
  query.set("includeCancelled", String(params.includeCancelled ?? true));

  return query.toString();
}

export async function getOrganizationPaymentHistory(
  organizationId: string,
  params: GetOrganizationPaymentHistoryParams = {}
) {
  const query = buildQuery(params);
  const url = query
    ? `/api/organizations/${organizationId}/payments/history?${query}`
    : `/api/organizations/${organizationId}/payments/history`;

  return apiFetch<OrganizationPaymentHistoryResponseDto>(url);
}