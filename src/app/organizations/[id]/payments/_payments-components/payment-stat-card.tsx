"use client";

type PaymentStatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  accentClass?: string;
  onClick?: () => void;
  isActive?: boolean;
  badge?: string;
};

export default function PaymentStatCard({
  title,
  value,
  subtitle,
  accentClass,
  onClick,
  isActive,
  badge,
}: PaymentStatCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[24px] border p-4 text-left shadow-sm transition ${
        onClick ? "hover:-translate-y-0.5 hover:shadow-md" : ""
      } ${
        isActive ? "border-slate-400 bg-slate-50" : "border-slate-200 bg-white/90"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`mb-4 h-1.5 w-14 rounded-full ${accentClass ?? "bg-slate-900"}`}
        />
        {badge ? (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {badge}
          </span>
        ) : null}
      </div>

      <div className="text-sm font-medium text-slate-500">{title}</div>
      <div className="mt-2 text-[20px] font-semibold tracking-tight text-slate-900">
        {value}
      </div>

      {subtitle ? (
        <div className="mt-2 text-xs leading-5 text-slate-500">{subtitle}</div>
      ) : null}
    </button>
  );
}