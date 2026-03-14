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
  totalRemainingAmount: number;
  collectionRate: number;
  currency: string;
  memberCount: number;
  paidCount: number;
  overdueCount: number;
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
}: PaymentDashboardHeroCardProps) {
  const normalizedRate = Math.max(0, Math.min(100, collectionRate));

  return (
    <div
      className="overflow-hidden rounded-[28px] border p-5 text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] md:p-6"
      style={{
        borderColor: "var(--border)",
        background:
          "linear-gradient(120deg, var(--primary) 0%, var(--primary-hover) 55%, #334155 100%)",
        color: "var(--text-on-dark)",
      }}
    >
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
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

            <div
              className="h-2 w-6 rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.14)" }}
            />
          </div>

          <h1 className="mt-4 text-[34px] font-semibold tracking-tight">
            Aidat ve Ödemeler
          </h1>

          <p
            className="mt-3 max-w-2xl text-sm leading-7"
            style={{ color: "var(--text-on-dark-muted)" }}
          >
            Üyelerin dönem bazlı borçlarını, tahsilat durumunu, geciken ödemeleri
            ve son tahsilat hareketlerini daha net bir görünümle tek ekranda yönet.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <div
              className="rounded-2xl border px-4 py-3"
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
              <div className="mt-1 text-[18px] font-semibold">
                {formatCurrency(totalCollectedAmount, currency)}
              </div>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
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
              <div className="mt-1 text-[18px] font-semibold">
                {formatCurrency(totalRemainingAmount, currency)}
              </div>
            </div>

            <div
              className="rounded-2xl border px-4 py-3"
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
              <div className="mt-1 text-[18px] font-semibold">
                {formatCurrency(totalExpectedAmount, currency)}
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

            <div className="mt-1 text-[30px] font-semibold">
              %{normalizedRate.toFixed(0)}
            </div>

            <div
              className="mt-3 h-3 w-full overflow-hidden rounded-full"
              style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${normalizedRate}%`,
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

            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div>
                <div style={{ color: "var(--text-on-dark-muted)" }}>Toplam üye</div>
                <div className="mt-1 font-semibold">{memberCount}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-on-dark-muted)" }}>Ödeyen</div>
                <div className="mt-1 font-semibold">{paidCount}</div>
              </div>
              <div>
                <div style={{ color: "var(--text-on-dark-muted)" }}>Geciken</div>
                <div className="mt-1 font-semibold">{overdueCount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}