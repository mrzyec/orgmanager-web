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
    <div className="overflow-hidden rounded-[28px] border border-slate-200/70 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] md:p-6">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.35fr_0.85fr]">
        <div>
          <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-slate-100">
            {getCollectionTypeLabel(collectionType)} aidat sistemi
          </div>

          <h1 className="mt-3 text-[32px] font-semibold tracking-tight">
            Aidat ve Ödemeler
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
            Üyelerin dönem bazlı borçlarını, tahsilat durumunu, geciken ödemeleri
            ve son tahsilat hareketlerini tek ekranda yönetin.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
              Aktif dönem
            </div>
            <div className="mt-1.5 text-[18px] font-semibold">{activePeriodLabel}</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
              Tahsil edilen
            </div>
            <div className="mt-1.5 text-[18px] font-semibold">
              {formatCurrency(totalCollectedAmount, currency)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
              Tahsilat oranı
            </div>
            <div className="mt-1.5 text-[18px] font-semibold">
              %{collectionRate.toFixed(0)}
            </div>
            <div className="mt-1 text-xs text-slate-300">
              Beklenen: {formatCurrency(totalExpectedAmount, currency)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}