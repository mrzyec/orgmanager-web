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
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}