"use client";

import { AppButton, AppCard, AppSectionHeader } from "@/components/ui";
import { StatusPill } from "@/components/badges";
import type { OrganizationJoinRequestDto } from "@/lib/api";

type PendingRequestsSectionProps = {
  requests: OrganizationJoinRequestDto[];
  loading: boolean;
  actionLoading: boolean;
  onReview: (requestId: string, approve: boolean) => void;
};

type ReviewedRequestsSectionProps = {
  requests: OrganizationJoinRequestDto[];
  loading: boolean;
};

function formatUtcDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getRequestEmail(request: OrganizationJoinRequestDto): string {
  const r = request as OrganizationJoinRequestDto & {
    email?: string | null;
    requesterEmail?: string | null;
    userEmail?: string | null;
    applicantEmail?: string | null;
  };

  return (
    r.email?.trim() ||
    r.requesterEmail?.trim() ||
    r.userEmail?.trim() ||
    r.applicantEmail?.trim() ||
    "-"
  );
}

function RequestInfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-all text-sm font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

function RequestStatusBadge({ status }: { status: string }) {
  if (status === "Approved") {
    return <StatusPill label="Onaylandı" active tone="green" />;
  }

  if (status === "Rejected") {
    return <StatusPill label="Reddedildi" active tone="yellow" />;
  }

  return <StatusPill label="Beklemede" active tone="blue" />;
}

export function PendingRequestsSection({
  requests,
  loading,
  actionLoading,
  onReview,
}: PendingRequestsSectionProps) {
  return (
    <AppCard>
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 p-5">
        <AppSectionHeader
          title="Bekleyen katılım talepleri"
          description="Organizasyona katılmak isteyen kullanıcıların taleplerini burada onaylayabilir veya reddedebilirsin."
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
            Bekleyen talep: {requests.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          Katılım talepleri yükleniyor...
        </div>
      ) : requests.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm leading-6 text-slate-600">
          Şu anda bekleyen bir katılım talebi bulunmuyor.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((request) => {
            const requestEmail = getRequestEmail(request);

            return (
              <div
                key={request.id}
                className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-blue-50/30 p-5 shadow-sm"
              >
                <div className="flex flex-col gap-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <RequestStatusBadge status={request.status} />
                      <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                        Yeni başvuru
                      </span>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Başvuran e-posta
                      </div>
                      <div className="mt-2 break-all text-xl font-semibold tracking-tight text-slate-900">
                        {requestEmail}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <RequestInfoBlock
                      label="Başvuran e-posta"
                      value={requestEmail}
                    />
                    <RequestInfoBlock label="Talep Id" value={request.id} />
                    <RequestInfoBlock
                      label="Başvuru tarihi"
                      value={formatUtcDate(request.createdAtUtc)}
                    />
                    <RequestInfoBlock
                      label="Durum"
                      value={request.status}
                    />
                    <RequestInfoBlock
                      label="Son güncelleme"
                      value={formatUtcDate(request.updatedAtUtc)}
                    />
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white/90 p-4">
                    <div className="mb-3 text-sm font-semibold text-slate-900">
                      Talep aksiyonları
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <AppButton
                        onClick={() => onReview(request.id, true)}
                        disabled={actionLoading}
                        className="w-full"
                      >
                        Onayla
                      </AppButton>

                      <AppButton
                        tone="danger"
                        onClick={() => onReview(request.id, false)}
                        disabled={actionLoading}
                        className="w-full"
                      >
                        Reddet
                      </AppButton>
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

export function ReviewedRequestsSection({
  requests,
  loading,
}: ReviewedRequestsSectionProps) {
  const approvedCount = requests.filter((x) => x.status === "Approved").length;
  const rejectedCount = requests.filter((x) => x.status === "Rejected").length;

  return (
    <AppCard>
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-5">
        <AppSectionHeader
          title="Sonuçlanmış katılım talepleri"
          description="Onaylanmış veya reddedilmiş başvurular burada geçmiş olarak görüntülenir."
        />

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Onaylanan: {approvedCount}
          </span>
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Reddedilen: {rejectedCount}
          </span>
          <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
            Toplam: {requests.length}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          Sonuçlanmış talepler yükleniyor...
        </div>
      ) : requests.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm leading-6 text-slate-600">
          Henüz sonuçlanmış bir katılım talebi bulunmuyor.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {requests.map((request) => {
            const requestEmail = getRequestEmail(request);

            return (
              <div
                key={request.id}
                className={`rounded-[28px] border p-5 shadow-sm ${
                  request.status === "Approved"
                    ? "border-emerald-200 bg-gradient-to-r from-emerald-50 via-white to-emerald-50/50"
                    : "border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/50"
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <RequestStatusBadge status={request.status} />
                  </div>

                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Başvuran e-posta
                    </div>
                    <div className="mt-2 break-all text-xl font-semibold tracking-tight text-slate-900">
                      {requestEmail}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <RequestInfoBlock
                      label="Başvuran e-posta"
                      value={requestEmail}
                    />
                    <RequestInfoBlock label="Talep Id" value={request.id} />
                    <RequestInfoBlock
                      label="Başvuru tarihi"
                      value={formatUtcDate(request.createdAtUtc)}
                    />
                    <RequestInfoBlock
                      label="Durum"
                      value={request.status}
                    />
                    <RequestInfoBlock
                      label="Son güncelleme"
                      value={formatUtcDate(request.updatedAtUtc)}
                    />
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