"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition-all duration-200 hover:border-gray-500 hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-2xl border border-black bg-black px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:border-gray-700 hover:bg-gray-900 hover:shadow-md hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

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
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc,#eef2f7)] px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
              Katılım
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
              Katılım kodu ile başvur
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Owner tarafından verilen kod ile organizasyona başvuru gönderebilirsin.
            </p>
          </div>

          <Link href="/dashboard" className={secondaryButtonClass}>
            Dashboard
          </Link>
        </div>

        <section className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_12px_34px_rgba(15,23,42,0.07)] backdrop-blur">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Örn: ORG-ABC123"
              className="flex-1 rounded-3xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all duration-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100"
            />

            <button type="submit" disabled={actionLoading} className={primaryButtonClass}>
              {actionLoading ? "Gönderiliyor..." : "Başvuru gönder"}
            </button>
          </form>
        </section>

        <section className="rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_12px_34px_rgba(15,23,42,0.07)] backdrop-blur">
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
                            onClick={() => handleCancelRequest(request)}
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
        </section>
      </div>
    </main>
  );
}