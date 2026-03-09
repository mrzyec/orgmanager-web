"use client";

import { AppCard, AppLinkButton } from "@/components/ui";
import { JoinRequestStatusBadge } from "@/components/badges";
import type { OrganizationJoinRequestDto } from "@/lib/api";

function formatUtcDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function JoinRequestSummaryCard({
  requests,
}: {
  requests: OrganizationJoinRequestDto[];
}) {
  const pendingCount = requests.filter((x) => x.status === "Pending").length;
  const approvedCount = requests.filter((x) => x.status === "Approved").length;
  const rejectedCount = requests.filter((x) => x.status === "Rejected").length;

  const latestPending = requests.find((x) => x.status === "Pending");

  return (
    <AppCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Başvuru durumu
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Katılım kodu ile gönderdiğin başvuruların kısa özeti.
          </p>
        </div>

        <AppLinkButton href="/join">Başvurularımı aç</AppLinkButton>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5">
          <div className="text-sm text-amber-700">Bekleyen</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-amber-800">
            {pendingCount}
          </div>
        </div>

        <div className="rounded-3xl border border-green-200/80 bg-gradient-to-br from-green-50 to-white p-5">
          <div className="text-sm text-green-700">Onaylanan</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-green-800">
            {approvedCount}
          </div>
        </div>

        <div className="rounded-3xl border border-red-200/80 bg-gradient-to-br from-red-50 to-white p-5">
          <div className="text-sm text-red-700">Reddedilen</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-red-800">
            {rejectedCount}
          </div>
        </div>
      </div>

      {latestPending ? (
        <div className="mt-5 rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white p-5">
          <div className="text-sm font-medium text-amber-900">
            Bekleyen son başvuru
          </div>
          <div className="mt-1 text-base font-medium text-amber-800">
            {latestPending.organizationName}
          </div>
          <div className="mt-1 text-xs text-amber-700">
            Oluşturulma: {formatUtcDate(latestPending.createdAtUtc)}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-gray-300 bg-gray-50/70 p-5 text-sm text-gray-600">
          Bekleyen bir başvurun bulunmuyor.
        </div>
      )}
    </AppCard>
  );
}

export function MyJoinRequestsList({
  requests,
  loading,
  actionLoading,
  onCancel,
}: {
  requests: OrganizationJoinRequestDto[];
  loading: boolean;
  actionLoading: boolean;
  onCancel: (request: OrganizationJoinRequestDto) => void;
}) {
  return (
    <AppCard>
      <div className="mb-4">
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
          Başvurularım
        </h2>
        <p className="mt-1 text-sm text-gray-600">
          Daha önce gönderdiğin başvuruları burada görebilirsin.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-gray-600">Başvurular yükleniyor...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/70 p-5 text-sm text-gray-600">
          Henüz hiç başvuru bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const isPending = request.status === "Pending";

            return (
              <div
                key={request.id}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {request.organizationName}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      Oluşturulma: {formatUtcDate(request.createdAtUtc)}
                    </div>

                    {request.reviewedAtUtc ? (
                      <div className="mt-1 text-xs text-gray-500">
                        Değerlendirilme: {formatUtcDate(request.reviewedAtUtc)}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center gap-2">
                    <JoinRequestStatusBadge status={request.status} />

                    {isPending ? (
                      <button
                        type="button"
                        onClick={() => onCancel(request)}
                        disabled={actionLoading}
                        className="inline-flex items-center justify-center rounded-2xl border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 shadow-sm transition-all duration-200 hover:border-red-400 hover:bg-red-100 hover:shadow-md hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Geri çek
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppCard>
  );
}