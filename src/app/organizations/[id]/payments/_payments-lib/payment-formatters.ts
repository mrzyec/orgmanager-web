import type {
  OrganizationPaymentSettingsDto,
  RecentOrganizationMemberPaymentDto,
} from "@/lib/api";
import type {
  PaymentCollectionType,
  RecentPaymentItem,
} from "./payment-page-types";

export function getDefaultYearString() {
  return String(new Date().getFullYear());
}

export function formatCurrency(amount: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null) {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function formatMonthYear(date: string | null) {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

export function formatYearOnly(date: string | null) {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
  }).format(parsed);
}

export function formatRevisionDateLabel(
  value: string,
  _period: "Monthly" | "Yearly" | string
) {
  if (!value) return "—";
  return formatDate(value);
}

export function getCollectionTypeLabel(type: PaymentCollectionType) {
  switch (type) {
    case "monthly":
      return "Aylık";
    case "yearly":
      return "Yıllık";
    default:
      return "Kapalı";
  }
}

export function mapCollectionType(
  settings: OrganizationPaymentSettingsDto | null
): PaymentCollectionType {
  if (!settings || !settings.isEnabled) return "disabled";
  return settings.period === "Yearly" ? "yearly" : "monthly";
}

export function getDateParts(date: string | null | undefined) {
  if (!date) {
    return {
      day: "1",
      month: "1",
      year: getDefaultYearString(),
    };
  }

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return {
      day: "1",
      month: "1",
      year: getDefaultYearString(),
    };
  }

  return {
    day: String(parsed.getUTCDate()),
    month: String(parsed.getUTCMonth() + 1),
    year: String(parsed.getUTCFullYear()),
  };
}

export function buildIsoFromDateParts(
  day: string,
  month: string,
  year: string,
  period: "Monthly" | "Yearly"
) {
  if (!year) return null;

  const numericYear = Number(year);
  if (!Number.isInteger(numericYear)) return null;

  if (period === "Yearly") {
    return new Date(Date.UTC(numericYear, 0, 1, 12, 0, 0)).toISOString();
  }

  if (!day || !month) return null;

  const numericDay = Number(day);
  const numericMonth = Number(month);

  if (!Number.isInteger(numericDay) || !Number.isInteger(numericMonth)) {
    return null;
  }

  const constructed = new Date(
    Date.UTC(numericYear, numericMonth - 1, numericDay, 12, 0, 0)
  );

  if (Number.isNaN(constructed.getTime())) return null;

  if (
    constructed.getUTCFullYear() !== numericYear ||
    constructed.getUTCMonth() !== numericMonth - 1 ||
    constructed.getUTCDate() !== numericDay
  ) {
    return null;
  }

  return constructed.toISOString();
}

export function buildRevisionIsoFromDateParts(
  day: string,
  month: string,
  year: string,
  period: "Monthly" | "Yearly"
) {
  if (!year) return null;

  const numericYear = Number(year);
  const numericMonth = Number(month);
  const numericDay = Number(day);

  if (
    !Number.isInteger(numericYear) ||
    !Number.isInteger(numericMonth) ||
    !Number.isInteger(numericDay)
  ) {
    return null;
  }

  const constructed = new Date(
    Date.UTC(
      numericYear,
      numericMonth - 1,
      period === "Yearly" ? numericDay : 1,
      12,
      0,
      0
    )
  );

  if (Number.isNaN(constructed.getTime())) return null;

  if (period === "Yearly") {
    if (
      constructed.getUTCFullYear() !== numericYear ||
      constructed.getUTCMonth() !== numericMonth - 1 ||
      constructed.getUTCDate() !== numericDay
    ) {
      return null;
    }

    return constructed.toISOString();
  }

  if (
    constructed.getUTCFullYear() !== numericYear ||
    constructed.getUTCMonth() !== numericMonth - 1
  ) {
    return null;
  }

  return new Date(
    Date.UTC(numericYear, numericMonth - 1, 1, 12, 0, 0)
  ).toISOString();
}

export function mapRecentPayments(
  items: RecentOrganizationMemberPaymentDto[]
): RecentPaymentItem[] {
  return items.map((x) => ({
    paymentId: x.paymentId,
    memberDisplayName: x.email,
    memberEmail: x.email,
    amount: x.amount,
    currency: x.currency,
    periodLabel: x.periodLabel,
    paidAt: x.paidAtUtc,
    markedByDisplayName: x.markedByEmail,
    methodLabel: x.paymentMethod,
    status: x.status,
  }));
}