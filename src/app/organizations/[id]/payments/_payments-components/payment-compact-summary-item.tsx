"use client";

type PaymentCompactSummaryItemProps = {
  label: string;
  value: string;
};

export default function PaymentCompactSummaryItem({
  label,
  value,
}: PaymentCompactSummaryItemProps) {
  return (
    <div
      className="rounded-2xl border px-3 py-2 shadow-sm"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface-solid)",
      }}
    >
      <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold" style={{ color: "var(--text)" }}>
        {value}
      </div>
    </div>
  );
}
