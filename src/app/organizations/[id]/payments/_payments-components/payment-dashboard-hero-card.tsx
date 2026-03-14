"use client";

import Link from "next/link";

type PaymentCollectionType = "monthly" | "yearly" | "disabled";

function getCollectionTypeLabel(type: PaymentCollectionType) {
  switch (type) {
    case "monthly":
      return "Aylık";
    case "yearly":
      return "Yıllık";
    default:
      return "Kapalı";
  }
}

function formatCurrency(amount: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

type PaymentDashboardHeroCardProps = {
  organizationId: string;
  organizationName: string;
  collectionType: PaymentCollectionType;
  activePeriodLabel: string;
  totalCollectedAmount: number;
  totalExpectedAmount: number;
  totalRemainingAmount: number;
  collectionRate: number;
  currency: string;
  totalMemberCount: number;
  paidCount: number;
  overdueCount: number;
};

export default function PaymentDashboardHeroCard({
  organizationId,
  organizationName,
  collectionType,
  activePeriodLabel,
  totalCollectedAmount,
  totalExpectedAmount,
  totalRemainingAmount,
  collectionRate,
  currency,
  totalMemberCount,
  paidCount,
  overdueCount,
}: PaymentDashboardHeroCardProps) {
  return (
    <div
      className="overflow-hidden rounded-[28px] border p-5 text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] md:p-6"
      style={{
        borderColor: "var(--border)",
        background:
          "linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 55%, #334155 100%)",
        color: "var(--text-on-dark)",
      }}
    >
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="inline-flex rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                borderColor: "rgba(255,255,255,0.15)",
                backgroundColor: "rgba(255,255,255,0.10)",
                color: "var(--text-on-dark-muted)",
              }}
            >
              {getCollectionTypeLabel(collectionType)} aidat sistemi
            </div>

            <div
              className="inline-flex rounded-full border px-3 py-1 text-xs font-medium"
              style={{
                borderColor: "rgba(255,255,255,0.15)",
                backgroundColor: "rgba(255,255,255,0.08)",
                color: "var(--text-on-dark-muted)",
              }}
            >
              {organizationName}
            </div>
          </div>

          <h1 className="mt-4 text-[30px] font-semibold tracking-tight md:text-[34px]">
            Aidat ve Ödemeler
          </h1>

          <p
            className="mt-2 max-w-2xl text-sm leading-6"
            style={{ color: "var(--text-on-dark-muted)" }}
          >
            Üyelerin dönem bazlı borçlarını, tahsilat durumunu, geciken ödemeleri ve
            son hareketleri daha net bir görünümle tek ekranda yönet.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/organizations/${organizationId}`}
              className="rounded-2xl border px-4 py-2.5 text-sm font-medium transition hover:brightness-110"
              style={{
                borderColor: "rgba(255,255,255,0.16)",
                backgroundColor: "rgba(255,255,255,0.12)",
                color: "var(--text-on-dark)",
              }}
            >
              Organizasyon özetine dön
            </Link>

            <div
              className="rounded-2xl border px-4 py-2.5 text-sm font-medium"
              style={{
                borderColor: "rgba(255,255,255,0.16)",
                backgroundColor: "rgba(255,255,255,0.06)",
                color: "var(--text-on-dark-muted)",
              }}
            >
              Detaylı tarih bazlı ödeme geçmişi bir sonraki adımda eklenecek
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: "rgba(255,255,255,0.10)",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: "var(--text-on-dark-muted)" }}
              >
                Tahsil edilen
              </div>
              <div className="mt-1.5 text-[20px] font-semibold">
                {formatCurrency(totalCollectedAmount, currency)}
              </div>
            </div>

            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: "rgba(255,255,255,0.10)",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: "var(--text-on-dark-muted)" }}
              >
                Açık alacak
              </div>
              <div className="mt-1.5 text-[20px] font-semibold">
                {formatCurrency(totalRemainingAmount, currency)}
              </div>
            </div>

            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: "rgba(255,255,255,0.10)",
                backgroundColor: "rgba(255,255,255,0.08)",
              }}
            >
              <div
                className="text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: "var(--text-on-dark-muted)" }}
              >
                Beklenen toplam
              </div>
              <div className="mt-1.5 text-[20px] font-semibold">
                {formatCurrency(totalExpectedAmount, currency)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <div
            className="rounded-2xl border p-4 backdrop-blur-sm"
            style={{
              borderColor: "rgba(255,255,255,0.10)",
              backgroundColor: "rgba(255,255,255,0.10)",
            }}
          >
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: "var(--text-on-dark-muted)" }}
            >
              Aktif dönem
            </div>
            <div className="mt-1.5 text-[18px] font-semibold">{activePeriodLabel}</div>
          </div>

          <div
            className="rounded-2xl border p-4 backdrop-blur-sm"
            style={{
              borderColor: "rgba(255,255,255,0.10)",
              backgroundColor: "rgba(255,255,255,0.10)",
            }}
          >
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: "var(--text-on-dark-muted)" }}
            >
              Tahsilat oranı
            </div>
            <div className="mt-1.5 text-[28px] font-semibold">
              %{collectionRate.toFixed(0)}
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/15">
              <div
                className="h-2 rounded-full bg-white"
                style={{ width: `${Math.max(0, Math.min(collectionRate, 100))}%` }}
              />
            </div>
          </div>

          <div
            className="rounded-2xl border p-4 backdrop-blur-sm"
            style={{
              borderColor: "rgba(255,255,255,0.10)",
              backgroundColor: "rgba(255,255,255,0.10)",
            }}
          >
            <div
              className="text-[11px] font-semibold uppercase tracking-[0.08em]"
              style={{ color: "var(--text-on-dark-muted)" }}
            >
              Üye özeti
            </div>
            <div className="mt-2 space-y-1 text-sm">
              <div>Toplam üye: {totalMemberCount}</div>
              <div>Ödeyen: {paidCount}</div>
              <div>Geciken: {overdueCount}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}