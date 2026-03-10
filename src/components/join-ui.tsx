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

function SummaryStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "amber" | "green" | "red";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200 bg-gradient-to-br from-amber-50 via-white to-amber-50/60"
      : tone === "green"
      ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60"
      : "border-red-200 bg-gradient-to-br from-red-50 via-white to-red-50/60";

  const textClass =
    tone === "amber"
      ? "text-amber-800"
      : tone === "green"
      ? "text-emerald-800"
      : "text-red-800";

  const labelClass =
    tone === "amber"
      ? "text-amber-700"
      : tone === "green"
      ? "text-emerald-700"
      : "text-red-700";

  return (
    <div className={`rounded-[28px] border p-5 shadow-sm ${toneClass}`}>
      <div className={`text-sm font-medium ${labelClass}`}>{label}</div>
      <div className={`mt-2 text-3xl font-semibold tracking-tight ${textClass}`}>
        {value}
      </div>
    </div>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900 break-words">
        {value}
      </div>
    </div>
  );
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
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Başvuru durumu
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Katılım kodu ile gönderdiğin başvuruların kısa özetini burada görebilirsin.
            </p>
          </div>

          <AppLinkButton href="/join">Başvurularımı aç</AppLinkButton>
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <SummaryStat
          label="Bekleyen"
          value={String(pendingCount)}
          tone="amber"
        />
        <SummaryStat
          label="Onaylanan"
          value={String(approvedCount)}
          tone="green"
        />
        <SummaryStat
          label="Reddedilen"
          value={String(rejectedCount)}
          tone="red"
        />
      </div>

      {latestPending ? (
        <div className="mt-6 rounded-[28px] border border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/60 p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-amber-900">
                Bekleyen son başvuru
              </div>
              <div className="mt-2 text-lg font-semibold tracking-tight text-slate-900">
                {latestPending.organizationName}
              </div>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Bu başvuru henüz sonuçlanmamış görünüyor.
              </p>
            </div>

            <div className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm">
              Beklemede
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <InfoBlock
              label="Organizasyon"
              value={latestPending.organizationName || "-"}
            />
            <InfoBlock
              label="Oluşturulma tarihi"
              value={formatUtcDate(latestPending.createdAtUtc)}
            />
            <InfoBlock
              label="Durum"
              value={latestPending.status}
            />
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm leading-6 text-slate-600">
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
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-5">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-slate-900">
            Başvurularım
          </h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Daha önce gönderdiğin başvuruları burada görüntüleyebilir, bekleyen taleplerini geri çekebilirsin.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          Başvurular yükleniyor...
        </div>
      ) : requests.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm leading-6 text-slate-600">
          Henüz hiç başvuru bulunmuyor.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((request) => {
            const isPending = request.status === "Pending";

            return (
              <div
                key={request.id}
                className={`rounded-[28px] border p-5 shadow-sm ${
                  request.status === "Pending"
                    ? "border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/40"
                    : request.status === "Approved"
                    ? "border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/40"
                    : "border-red-200 bg-gradient-to-r from-red-50 via-white to-red-50/40"
                }`}
              >
                <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-semibold tracking-tight text-slate-900 break-words">
                      {request.organizationName}
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <InfoBlock
                        label="Durum"
                        value={request.status}
                      />
                      <InfoBlock
                        label="Oluşturulma"
                        value={formatUtcDate(request.createdAtUtc)}
                      />
                      <InfoBlock
                        label="Değerlendirilme"
                        value={request.reviewedAtUtc ? formatUtcDate(request.reviewedAtUtc) : "-"}
                      />
                      <InfoBlock
                        label="Talep Id"
                        value={request.id}
                      />
                    </div>
                  </div>

                  <div className="w-full xl:w-[220px]">
                    <div className="rounded-3xl border border-slate-200 bg-white/90 p-4">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          Durum
                        </span>
                        <JoinRequestStatusBadge status={request.status} />
                      </div>

                      {isPending ? (
                        <button
                          type="button"
                          onClick={() => onCancel(request)}
                          disabled={actionLoading}
                          className="inline-flex w-full items-center justify-center rounded-2xl border border-red-300 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 shadow-sm transition-all duration-200 hover:border-red-400 hover:bg-red-100 hover:shadow-md hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {actionLoading ? "İşleniyor..." : "Başvuruyu geri çek"}
                        </button>
                      ) : (
                        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                          Bu başvuru artık işlem beklemiyor.
                        </div>
                      )}
                    </div>
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