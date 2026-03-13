"use client";

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
  collectionRate: number;
  currency: string;
};

export default function PaymentDashboardHeroCard({
  collectionType,
  activePeriodLabel,
  totalCollectedAmount,
  totalExpectedAmount,
  collectionRate,
  currency,
}: PaymentDashboardHeroCardProps) {
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

          <h1 className="mt-3 text-[32px] font-semibold tracking-tight">
            Aidat ve Ödemeler
          </h1>

          <p
            className="mt-2 max-w-2xl text-sm leading-6"
            style={{ color: "var(--text-on-dark-muted)" }}
          >
            Üyelerin dönem bazlı borçlarını, tahsilat durumunu, geciken ödemeleri
            ve son tahsilat hareketlerini tek ekranda yönetin.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
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
              Tahsil edilen
            </div>
            <div className="mt-1.5 text-[18px] font-semibold">
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
              Tahsilat oranı
            </div>
            <div className="mt-1.5 text-[18px] font-semibold">
              %{collectionRate.toFixed(0)}
            </div>
            <div className="mt-1 text-xs" style={{ color: "var(--text-on-dark-muted)" }}>
              Beklenen: {formatCurrency(totalExpectedAmount, currency)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
