"use client";

type AccentTone = "primary" | "info" | "success" | "warning" | "danger" | "muted";

type PaymentStatCardProps = {
  title: string;
  value: string;
  subtitle?: string;
  accentTone?: AccentTone;
  onClick?: () => void;
  isActive?: boolean;
  badge?: string;
};

function getAccentColor(accentTone: AccentTone) {
  switch (accentTone) {
    case "success":
      return "var(--success-text)";
    case "warning":
      return "var(--warning-text)";
    case "danger":
      return "var(--danger-text)";
    case "info":
      return "var(--border-strong)";
    case "muted":
      return "var(--text-muted)";
    default:
      return "var(--primary)";
  }
}

export default function PaymentStatCard({
  title,
  value,
  subtitle,
  accentTone = "primary",
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
      }`}
      style={{
        borderColor: isActive ? "var(--border-strong)" : "var(--border)",
        backgroundColor: isActive ? "var(--surface-soft)" : "var(--surface)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className="mb-4 h-1.5 w-14 rounded-full"
          style={{ backgroundColor: getAccentColor(accentTone) }}
        />
        {badge ? (
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-medium"
            style={{
              backgroundColor: "var(--surface-soft-2)",
              color: "var(--text-muted)",
            }}
          >
            {badge}
          </span>
        ) : null}
      </div>

      <div className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        {title}
      </div>
      <div
        className="mt-2 text-[20px] font-semibold tracking-tight"
        style={{ color: "var(--text)" }}
      >
        {value}
      </div>

      {subtitle ? (
        <div className="mt-2 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </div>
      ) : null}
    </button>
  );
}
