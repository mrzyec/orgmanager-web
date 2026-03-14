"use client";

type Percentages = {
  paid: number;
  partial: number;
  unpaid: number;
  overdue: number;
};

type PaymentInsightsOverviewProps = {
  totalMemberCount: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  overdueCount: number;
  collectionRate: number;
  percentages: Percentages;
  onExportMembers: () => void;
  onExportPayments: () => void;
};

function InsightBar({
  label,
  value,
  percent,
  tone,
}: {
  label: string;
  value: number;
  percent: number;
  tone: "success" | "warning" | "muted" | "danger";
}) {
  const barColor =
    tone === "success"
      ? "var(--success-text)"
      : tone === "warning"
      ? "var(--warning-text)"
      : tone === "danger"
      ? "var(--danger-text)"
      : "var(--border-strong)";

  return (
    <div
      className="rounded-[24px] border p-4 shadow-sm"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          {label}
        </div>
        <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
          {value}
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full" style={{ backgroundColor: "var(--surface-soft-2)" }}>
        <div
          className="h-2 rounded-full"
          style={{
            width: `${Math.max(0, Math.min(percent, 100))}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
        %{percent.toFixed(0)}
      </div>
    </div>
  );
}

export default function PaymentInsightsOverview({
  totalMemberCount,
  paidCount,
  partialCount,
  unpaidCount,
  overdueCount,
  collectionRate,
  percentages,
  onExportMembers,
  onExportPayments,
}: PaymentInsightsOverviewProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
      <div
        className="rounded-[28px] border p-5 shadow-sm"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <div className="mb-4">
          <div className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Dağılım özeti
          </div>
          <div className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Üyelerin ödeme durumunu yüzde bazında hızlıca gör.
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <InsightBar
            label="Tam ödeyen"
            value={paidCount}
            percent={percentages.paid}
            tone="success"
          />
          <InsightBar
            label="Kısmi ödeyen"
            value={partialCount}
            percent={percentages.partial}
            tone="warning"
          />
          <InsightBar
            label="Bekleyen"
            value={unpaidCount}
            percent={percentages.unpaid}
            tone="muted"
          />
          <InsightBar
            label="Geciken"
            value={overdueCount}
            percent={percentages.overdue}
            tone="danger"
          />
        </div>
      </div>

      <div
        className="rounded-[28px] border p-5 shadow-sm"
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface)",
        }}
      >
        <div className="mb-4">
          <div className="text-base font-semibold" style={{ color: "var(--text)" }}>
            Hızlı çıktı alanı
          </div>
          <div className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Mevcut filtreleri baz alarak dışa aktarım yapabilirsin.
          </div>
        </div>

        <div
          className="rounded-2xl border px-4 py-3"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface-soft)",
          }}
        >
          <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
            Genel tahsilat görünümü
          </div>
          <div className="mt-2 text-3xl font-semibold" style={{ color: "var(--text)" }}>
            %{collectionRate.toFixed(0)}
          </div>
          <div className="mt-2 h-2 rounded-full" style={{ backgroundColor: "var(--surface-soft-2)" }}>
            <div
              className="h-2 rounded-full"
              style={{
                width: `${Math.max(0, Math.min(collectionRate, 100))}%`,
                backgroundColor: "var(--primary)",
              }}
            />
          </div>
          <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            Toplam üye: {totalMemberCount}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={onExportMembers}
            className="rounded-2xl border px-4 py-3 text-sm font-medium transition hover:brightness-[0.98]"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-solid)",
              color: "var(--text)",
            }}
          >
            Filtrelenmiş üye listesini CSV indir
          </button>

          <button
            type="button"
            onClick={onExportPayments}
            className="rounded-2xl px-4 py-3 text-sm font-medium transition hover:brightness-110"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-contrast)",
            }}
          >
            Filtrelenmiş tahsilat listesini CSV indir
          </button>
        </div>
      </div>
    </div>
  );
}