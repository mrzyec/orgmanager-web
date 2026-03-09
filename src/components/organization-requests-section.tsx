"use client";

import { AppButton, AppCard, AppSectionHeader } from "@/components/ui";
import { JoinRequestStatusBadge } from "@/components/badges";
import { UserInitialAvatar } from "@/components/detail-ui";
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

type PendingRequestsSectionProps = {
  requests: OrganizationJoinRequestDto[];
  loading: boolean;
  actionLoading: boolean;
  onReview: (requestId: string, approve: boolean) => void;
};

export function PendingRequestsSection({
  requests,
  loading,
  actionLoading,
  onReview,
}: PendingRequestsSectionProps) {
  return (
    <AppCard>
      <AppSectionHeader
        title="Bekleyen katılım talepleri"
        description="Katılım kodu ile gelen başvuruları onaylayabilir veya reddedebilirsin."
        right={
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
            Bekleyen talep: {requests.length}
          </div>
        }
      />

      {loading ? (
        <div className="text-sm text-gray-600">Talepler yükleniyor...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/70 p-5 text-sm text-gray-600">
          Bekleyen katılım talebi bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <UserInitialAvatar email={request.userEmail} />
                  <div>
                    <div className="text-sm font-semibold text-gray-900">
                      {request.userEmail}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <JoinRequestStatusBadge status={request.status} />
                      <span className="text-xs text-gray-500">
                        Talep tarihi: {formatUtcDate(request.createdAtUtc)}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      UserId: {request.userId}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <AppButton
                    tone="success"
                    size="sm"
                    onClick={() => onReview(request.id, true)}
                    disabled={actionLoading}
                  >
                    Başvuruyu onayla
                  </AppButton>

                  <AppButton
                    tone="danger"
                    size="sm"
                    onClick={() => onReview(request.id, false)}
                    disabled={actionLoading}
                  >
                    Başvuruyu reddet
                  </AppButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}

type ReviewedRequestsSectionProps = {
  requests: OrganizationJoinRequestDto[];
  loading: boolean;
};

export function ReviewedRequestsSection({
  requests,
  loading,
}: ReviewedRequestsSectionProps) {
  return (
    <AppCard>
      <AppSectionHeader
        title="Başvuru geçmişi"
        description="Sonuçlanmış başvuruları geçmiş olarak burada görebilirsin."
        right={
          <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800">
            Toplam geçmiş kayıt: {requests.length}
          </div>
        }
      />

      {loading ? (
        <div className="text-sm text-gray-600">Geçmiş yükleniyor...</div>
      ) : requests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/70 p-5 text-sm text-gray-600">
          Sonuçlanmış başvuru bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => (
            <div
              key={request.id}
              className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <UserInitialAvatar email={request.userEmail} />
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {request.userEmail}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <JoinRequestStatusBadge status={request.status} />
                    <span className="text-xs text-gray-500">
                      Başvuru: {formatUtcDate(request.createdAtUtc)}
                    </span>
                    {request.reviewedAtUtc ? (
                      <span className="text-xs text-gray-500">
                        Sonuçlanma: {formatUtcDate(request.reviewedAtUtc)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    UserId: {request.userId}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppCard>
  );
}