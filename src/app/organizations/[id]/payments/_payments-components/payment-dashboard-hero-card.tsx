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
  collectionType: PaymentCollectionType;
  activePeriodLabel: string;
  totalCollectedAmount: number;
  totalExpectedAmount: number;
  totalRemainingAmount: number;
  collectionRate: number;
  currency: string;
  memberCount: number;
  paidCount: number;
  overdueCount: number;
  organizationOverviewHref: string;
  paymentHistoryHref: string;
};

export default function PaymentDashboardHeroCard({
  collectionType,
  activePeriodLabel,
  totalCollectedAmount,
  totalExpectedAmount,
  totalRemainingAmount,
  collectionRate,
  currency,
  memberCount,
  paidCount,
  overdueCount,
  organizationOverviewHref,
  paymentHistoryHref,
}: PaymentDashboardHeroCardProps) {
  const safeCollectionRate = Number.isFinite(collectionRate)
    ? Math.max(0, Math.min(100, collectionRate))
    : 0;

  const safeRemainingAmount = Number.isFinite(totalRemainingAmount)
    ? totalRemainingAmount
    : 0;

  const safeExpectedAmount = Number.isFinite(totalExpectedAmount)
    ? totalExpectedAmount
    : 0;

  return (
    <div
      className="overflow-hidden rounded-[28px] border p-5 text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] md:p-6"
      style={{
        borderColor: "var(--border)",
        background:
          "linear-gradient(to right, var(--primary), var(--primary-hover), var(--primary))",
        color: "var(--text-on-dark)",
      }}
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <div>
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
          </div>

          <h1 className="mt-4 text-[32px] font-semibold tracking-tight">
            Aidat ve Ödemeler
          </h1>

          <p
            className="mt-3 max-w-2xl text-sm leading-8"
            style={{ color: "var(--text-on-dark-muted)" }}
          >
            Üyelerin dönem bazlı borçlarını, tahsilat durumunu, geciken ödemeleri
            ve son tahsilat hareketlerini tek ekranda takip et.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={organizationOverviewHref}
              className="inline-flex items-center rounded-2xl border px-4 py-2.5 text-sm font-medium transition hover:brightness-110"
              style={{
                borderColor: "rgba(255,255,255,0.14)",
                backgroundColor: "rgba(255,255,255,0.10)",
                color: "var(--text-on-dark)",
              }}
            >
              Organizasyon dashboardına dön
            </Link>

            <Link
              href={paymentHistoryHref}
              className="inline-flex items-center rounded-2xl border px-4 py-2.5 text-sm font-medium transition hover:brightness-110"
              style={{
                borderColor: "rgba(255,255,255,0.14)",
                backgroundColor: "rgba(255,255,255,0.10)",
                color: "var(--text-on-dark)",
              }}
            >
              Detaylı ödeme geçmişi
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
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
                Tahsil edilen
              </div>
              <div className="mt-2 text-[18px] font-semibold">
                {formatCurrency(totalCollectedAmount, currency)}
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
                Açık alacak
              </div>
              <div className="mt-2 text-[18px] font-semibold">
                {formatCurrency(safeRemainingAmount, currency)}
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
                Beklenen toplam
              </div>
              <div className="mt-2 text-[18px] font-semibold">
                {formatCurrency(safeExpectedAmount, currency)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
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
            <div className="mt-1.5 text-[18px] font-semibold">
              %{safeCollectionRate.toFixed(0)}
            </div>

            <div
              className="mt-4 h-3 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${safeCollectionRate}%`,
                  backgroundColor: "rgba(255,255,255,0.78)",
                }}
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

            <div className="mt-3 grid grid-cols-3 gap-3 text-sm">
              <div>
                <div style={{ color: "var(--text-on-dark-muted)" }}>Toplam üye</div>
                <div className="mt-1 text-lg font-semibold">{memberCount}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-on-dark-muted)" }}>Ödeyen</div>
                <div className="mt-1 text-lg font-semibold">{paidCount}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-on-dark-muted)" }}>Geciken</div>
                <div className="mt-1 text-lg font-semibold">{overdueCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}