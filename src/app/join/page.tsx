"use client";

import { useEffect, useState } from "react";
import {
  AppButton,
  AppCard,
  AppHero,
  AppLinkButton,
  AppPage,
} from "@/components/ui";
import { useToast } from "@/components/ToastProvider";
import {
  cancelOrganizationJoinRequest,
  createOrganizationJoinRequest,
  getAccessToken,
  getMyOrganizationJoinRequests,
  type OrganizationJoinRequestDto,
} from "@/lib/api";

function formatUtcDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function JoinRequestStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  if (normalized === "pending") {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
        Beklemede
      </span>
    );
  }

  if (normalized === "approved") {
    return (
      <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        Onaylandı
      </span>
    );
  }

  if (normalized === "rejected") {
    return (
      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
        Reddedildi
      </span>
    );
  }

  return (
    <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      {status}
    </span>
  );
}

export default function JoinPage() {
  const { showToast } = useToast();

  const [joinCode, setJoinCode] = useState("");
  const [requests, setRequests] = useState<OrganizationJoinRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadMyRequests() {
    try {
      const data = await getMyOrganizationJoinRequests();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!getAccessToken()) return;
    loadMyRequests();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!joinCode.trim()) {
      showToast({
        message: "Lütfen geçerli bir katılım kodu gir.",
        type: "error",
      });
      return;
    }

    setActionLoading(true);

    try {
      await createOrganizationJoinRequest(joinCode.trim().toUpperCase());
      setJoinCode("");
      await loadMyRequests();

      showToast({
        message: "Katılım talebin gönderildi. Owner onayı bekleniyor.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Katılım talebi gönderilemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancelRequest(request: OrganizationJoinRequestDto) {
    if (request.status !== "Pending") return;

    const confirmed = window.confirm(
      `${request.organizationName} için gönderdiğin başvuruyu geri çekmek istiyor musun?`
    );

    if (!confirmed) return;

    setActionLoading(true);

    try {
      await cancelOrganizationJoinRequest(request.id);
      setRequests((prev) => prev.filter((x) => x.id !== request.id));

      showToast({
        message: "Başvurun başarıyla geri çekildi.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Başvuru geri çekilemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AppPage>
      <AppHero
        badge="Katılım"
        title="Katılım kodu ile başvur"
        description="Owner tarafından verilen kod ile organizasyona başvuru gönderebilirsin."
        right={<AppLinkButton href="/dashboard">Dashboard</AppLinkButton>}
      />

      <AppCard>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Örn: ORG-ABC123"
            className="flex-1 rounded-3xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all duration-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100"
          />

          <AppButton type="submit" tone="primary" disabled={actionLoading}>
            {actionLoading ? "Gönderiliyor..." : "Başvuru gönder"}
          </AppButton>
        </form>
      </AppCard>

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
                        <AppButton
                          size="sm"
                          tone="danger"
                          onClick={() => handleCancelRequest(request)}
                          disabled={actionLoading}
                        >
                          Geri çek
                        </AppButton>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AppCard>
    </AppPage>
  );
}