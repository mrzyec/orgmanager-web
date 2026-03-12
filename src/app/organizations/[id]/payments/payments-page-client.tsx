"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  getOrganizationMemberPaymentPeriods,
  getOrganizationMemberPaymentStatuses,
  getOrganizationPaymentPlans,
  getOrganizationPaymentSettings,
  getRecentOrganizationPayments,
  payOrganizationMemberPeriod,
  upsertOrganizationPaymentPlan,
  upsertOrganizationPaymentSettings,
  type OrganizationMemberPaymentPeriodDto,
  type OrganizationMemberPaymentStatusDto,
  type OrganizationPaymentPlanDto,
  type OrganizationPaymentSettingsDto,
  type PaymentMethod,
  type RecentOrganizationMemberPaymentDto,
} from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

type PaymentCollectionType = "monthly" | "yearly" | "disabled";
type MemberPaymentStatus = "paid" | "partial" | "unpaid" | "overdue";
type StatusFilter = "all" | "paid" | "partial" | "unpaid" | "overdue";

type SettingsFormState = {
  isEnabled: boolean;
  period: "Monthly" | "Yearly";
  startDay: string;
  startMonth: string;
  startYear: string;
};

type PlanFormState = {
  amount: string;
  currency: "TRY" | "USD" | "EUR";
  isActive: boolean;
};

type MemberRow = {
  memberId: string;
  displayName: string;
  email: string;
  role: string;
  isActive: boolean;
  status: MemberPaymentStatus;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  totalOpenDebt: number;
  lastPaymentDate: string | null;
  currentDueDate: string | null;
  currentDuePeriodLabel: string | null;
  overduePeriods: number;
  totalPaymentCount: number;
};

type PaymentPeriodRow = {
  id: string;
  periodYear: number;
  periodMonth: number | null;
  periodLabel: string;
  periodStartUtc: string;
  periodType: string;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  currency: string;
  status: string;
  isOverdue: boolean;
  isCurrentPeriod: boolean;
  paymentCount: number;
  lastPaidAtUtc: string | null;
};

type RecentPaymentItem = {
  paymentId: string;
  memberDisplayName: string;
  memberEmail: string;
  amount: number;
  currency: string;
  periodLabel: string;
  paidAt: string;
  markedByDisplayName: string;
  methodLabel: string;
};

type PendingPaymentConfirm = {
  memberId: string;
  memberDisplayName: string;
  periodId: string;
  periodLabel: string;
  amount: number;
  currency: string;
};

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) =>
  String(new Date().getFullYear() - 2 + i)
);

function getDefaultYearString() {
  return String(new Date().getFullYear());
}

function formatCurrency(amount: number, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function formatMonthYear(date: string | null) {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    year: "numeric",
  }).format(parsed);
}

function formatYearOnly(date: string | null) {
  if (!date) return "—";

  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";

  return new Intl.DateTimeFormat("tr-TR", {
    year: "numeric",
  }).format(parsed);
}

function getDateParts(date: string | null | undefined) {
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

function buildIsoFromDateParts(
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

function getStatusLabel(status: MemberPaymentStatus) {
  switch (status) {
    case "paid":
      return "Ödendi";
    case "partial":
      return "Kısmi";
    case "overdue":
      return "Gecikti";
    default:
      return "Bekliyor";
  }
}

function getStatusBadgeClass(status: MemberPaymentStatus) {
  switch (status) {
    case "paid":
      return "border border-emerald-200 bg-emerald-50 text-emerald-700";
    case "partial":
      return "border border-amber-200 bg-amber-50 text-amber-700";
    case "overdue":
      return "border border-rose-200 bg-rose-50 text-rose-700";
    default:
      return "border border-slate-200 bg-slate-100 text-slate-700";
  }
}

function getPeriodStatusLabel(status: string, isOverdue: boolean) {
  if (isOverdue && status !== "Paid") return "Gecikti";
  if (status === "Paid") return "Ödendi";
  if (status === "Partial") return "Kısmi";
  return "Bekliyor";
}

function getPeriodStatusClass(status: string, isOverdue: boolean) {
  if (isOverdue && status !== "Paid") {
    return "border border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "Paid") {
    return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Partial") {
    return "border border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function mapCollectionType(
  settings: OrganizationPaymentSettingsDto | null
): PaymentCollectionType {
  if (!settings || !settings.isEnabled) return "disabled";
  return settings.period === "Yearly" ? "yearly" : "monthly";
}

function mapRecentPayments(items: RecentOrganizationMemberPaymentDto[]): RecentPaymentItem[] {
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
  }));
}

function SectionCard({
  title,
  description,
  children,
  rightSlot,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white/95 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {rightSlot}
      </div>
      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}

function CompactSummaryItem({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  accentClass,
  onClick,
  isActive,
  badge,
}: {
  title: string;
  value: string;
  subtitle?: string;
  accentClass?: string;
  onClick?: () => void;
  isActive?: boolean;
  badge?: string;
}) {
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
        <div className={`mb-4 h-1.5 w-14 rounded-full ${accentClass ?? "bg-slate-900"}`} />
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

function DashboardHeroCard({
  collectionType,
  activePeriodLabel,
  totalCollectedAmount,
  totalExpectedAmount,
  collectionRate,
  currency,
}: {
  collectionType: PaymentCollectionType;
  activePeriodLabel: string;
  totalCollectedAmount: number;
  totalExpectedAmount: number;
  collectionRate: number;
  currency: string;
}) {
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
            <div className="mt-1.5 text-[18px] font-semibold">%{collectionRate.toFixed(0)}</div>
            <div className="mt-1 text-xs text-slate-300">
              Beklenen: {formatCurrency(totalExpectedAmount, currency)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentConfirmModal({
  open,
  memberDisplayName,
  periodLabel,
  amount,
  currency,
  onCancel,
  onConfirm,
  isSubmitting,
}: {
  open: boolean;
  memberDisplayName: string;
  periodLabel: string;
  amount: number;
  currency: string;
  onCancel: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4">
          <div className="text-lg font-semibold text-slate-900">Ödeme Onayı</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            <span className="font-medium text-slate-900">{memberDisplayName}</span> için{" "}
            <span className="font-medium text-slate-900">{periodLabel}</span> dönemine{" "}
            <span className="font-medium text-slate-900">
              {formatCurrency(amount, currency)}
            </span>{" "}
            ödeme kaydı oluşturulacak.
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Bu işlem ödeme geçmişine yansıyacaktır. Devam etmek istediğine emin misin?
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            Vazgeç
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {isSubmitting ? "İşleniyor..." : "Ödemeyi Onayla"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrganizationPaymentsPageClient({
  organizationId,
}: {
  organizationId: string;
}) {
  const { showToast } = useToast();

  const [search, setSearch] = useState("");
  const [recentSearch, setRecentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [topDebtorsSearch, setTopDebtorsSearch] = useState("");
  const [regularPayersSearch, setRegularPayersSearch] = useState("");
  const [neverPaidSearch, setNeverPaidSearch] = useState("");

  const [settings, setSettings] = useState<OrganizationPaymentSettingsDto | null>(null);
  const [plans, setPlans] = useState<OrganizationPaymentPlanDto[]>([]);
  const [memberStatuses, setMemberStatuses] = useState<OrganizationMemberPaymentStatusDto[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPaymentItem[]>([]);
  const [periodsByMember, setPeriodsByMember] = useState<Record<string, PaymentPeriodRow[]>>({});

  const [expandedMemberIds, setExpandedMemberIds] = useState<string[]>([]);
  const [periodYearFilterByMember, setPeriodYearFilterByMember] = useState<Record<string, string>>({});
  const [showOpenOnlyByMember, setShowOpenOnlyByMember] = useState<Record<string, boolean>>({});
  const [paymentAmountByPeriod, setPaymentAmountByPeriod] = useState<Record<string, string>>({});
  const [payingPeriodId, setPayingPeriodId] = useState<string | null>(null);
  const [pendingPayment, setPendingPayment] = useState<PendingPaymentConfirm | null>(null);

  const [settingsForm, setSettingsForm] = useState<SettingsFormState>({
    isEnabled: false,
    period: "Monthly",
    startDay: "1",
    startMonth: "1",
    startYear: getDefaultYearString(),
  });

  const [planForm, setPlanForm] = useState<PlanFormState>({
    amount: "",
    currency: "TRY",
    isActive: true,
  });

  const [selectedPlanYear, setSelectedPlanYear] = useState<number | null>(null);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const loadSettingsAndPlans = useCallback(async () => {
    const [settingsResult, plansResult] = await Promise.all([
      getOrganizationPaymentSettings(organizationId),
      getOrganizationPaymentPlans(organizationId),
    ]);

    setSettings(settingsResult);
    setPlans(plansResult);

    const dateParts = getDateParts(settingsResult.startDateUtc);

    setSettingsForm({
      isEnabled: settingsResult.isEnabled,
      period: settingsResult.period === "Yearly" ? "Yearly" : "Monthly",
      startDay: dateParts.day,
      startMonth: dateParts.month,
      startYear: dateParts.year,
    });

    const compatiblePlans = plansResult
      .filter((x) => x.period === (settingsResult.period === "Yearly" ? "Yearly" : "Monthly"))
      .sort((a, b) => a.year - b.year);

    const selectedYear = dateParts.year ? Number(dateParts.year) : null;
    const currentYearPlan = selectedYear
      ? compatiblePlans.find((x) => x.year === selectedYear)
      : null;

    setPlanForm({
      amount: currentYearPlan ? String(currentYearPlan.amount) : "",
      currency:
        currentYearPlan?.currency === "USD" || currentYearPlan?.currency === "EUR"
          ? currentYearPlan.currency
          : "TRY",
      isActive: currentYearPlan?.isActive ?? true,
    });

    setSelectedPlanYear(currentYearPlan?.year ?? null);
  }, [organizationId]);

  const loadStatusesOnly = useCallback(async () => {
    const memberStatusesResult = await getOrganizationMemberPaymentStatuses(organizationId);
    setMemberStatuses(memberStatusesResult);
  }, [organizationId]);

  const loadRecentPaymentsOnly = useCallback(async () => {
    const recentResult = await getRecentOrganizationPayments(organizationId, 20);
    setRecentPayments(mapRecentPayments(recentResult));
  }, [organizationId]);

  const loadPageData = useCallback(async () => {
    try {
      setIsLoading(true);
      setPageError(null);

      await Promise.all([
        loadSettingsAndPlans(),
        loadStatusesOnly(),
        loadRecentPaymentsOnly(),
      ]);
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Ödeme ekranı yüklenirken bir hata oluştu."
      );
    } finally {
      setIsLoading(false);
    }
  }, [loadRecentPaymentsOnly, loadSettingsAndPlans, loadStatusesOnly]);

  useEffect(() => {
    loadPageData();
  }, [loadPageData]);

  useEffect(() => {
    const selectedYear = settingsForm.startYear ? Number(settingsForm.startYear) : null;

    if (!selectedYear) {
      setSelectedPlanYear(null);
      setPlanForm({
        amount: "",
        currency: "TRY",
        isActive: true,
      });
      return;
    }

    const currentPlan = plans.find(
      (x) => x.year === selectedYear && x.period === settingsForm.period
    );

    setSelectedPlanYear(currentPlan?.year ?? null);
    setPlanForm({
      amount: currentPlan ? String(currentPlan.amount) : "",
      currency:
        currentPlan?.currency === "USD" || currentPlan?.currency === "EUR"
          ? currentPlan.currency
          : "TRY",
      isActive: currentPlan?.isActive ?? true,
    });
  }, [settingsForm.startYear, settingsForm.period, plans]);

  const collectionType = mapCollectionType(settings);

  const compatiblePlans = useMemo(() => {
    return plans
      .filter((x) => x.period === settingsForm.period)
      .sort((a, b) => a.year - b.year);
  }, [plans, settingsForm.period]);

  const compatiblePlanMap = useMemo(() => {
    const map = new Map<number, OrganizationPaymentPlanDto>();
    for (const plan of compatiblePlans) map.set(plan.year, plan);
    return map;
  }, [compatiblePlans]);

  const activeCurrency =
    compatiblePlanMap.get(Number(settingsForm.startYear))?.currency ??
    settings?.currency ??
    "TRY";

  const recentPaymentMetrics = useMemo(() => {
    const map = new Map<
      string,
      {
        count: number;
        lastPaidAt: string | null;
      }
    >();

    for (const payment of recentPayments) {
      const current = map.get(payment.memberEmail) ?? { count: 0, lastPaidAt: null };
      const latestDate =
        !current.lastPaidAt || new Date(payment.paidAt) > new Date(current.lastPaidAt)
          ? payment.paidAt
          : current.lastPaidAt;

      map.set(payment.memberEmail, {
        count: current.count + 1,
        lastPaidAt: latestDate,
      });
    }

    return map;
  }, [recentPayments]);

  const members = useMemo<MemberRow[]>(() => {
    return memberStatuses.map((item) => {
      const planAmountForVisibleYear =
        compatiblePlans.length > 0
          ? compatiblePlans[compatiblePlans.length - 1].amount
          : 0;

      const paidAmount = item.currentPeriodPaidAmount ?? 0;
      const remainingAmount = Math.max(planAmountForVisibleYear - paidAmount, 0);
      const totalOpenDebt = item.totalOutstandingAmount ?? remainingAmount;
      const paymentMetric = recentPaymentMetrics.get(item.email);

      let status: MemberPaymentStatus;
      if (item.isOverdue && paidAmount > 0) status = "partial";
      else if (item.isOverdue) status = "overdue";
      else if (paidAmount >= planAmountForVisibleYear && planAmountForVisibleYear > 0) status = "paid";
      else if (paidAmount > 0) status = "partial";
      else status = "unpaid";

      return {
        memberId: item.organizationMemberId,
        displayName: item.email,
        email: item.email,
        role: item.role,
        isActive: item.isMemberActive,
        status,
        expectedAmount: planAmountForVisibleYear,
        paidAmount,
        remainingAmount,
        totalOpenDebt,
        lastPaymentDate: paymentMetric?.lastPaidAt ?? item.lastPaidAtUtc ?? null,
        currentDueDate: item.nextDueDateUtc ?? null,
        currentDuePeriodLabel:
          settingsForm.period === "Yearly"
            ? item.nextDueDateUtc
              ? formatYearOnly(item.nextDueDateUtc)
              : "—"
            : formatMonthYear(item.nextDueDateUtc ?? null),
        overduePeriods: item.overduePeriodCount ?? (item.isOverdue ? 1 : 0),
        totalPaymentCount: paymentMetric?.count ?? 0,
      };
    });
  }, [memberStatuses, compatiblePlans, recentPaymentMetrics, settingsForm.period]);

  const filteredMembers = useMemo(() => {
    const q = search.trim().toLowerCase();

    return members.filter((member) => {
      const matchesSearch =
        q.length === 0
          ? true
          : member.displayName.toLowerCase().includes(q) ||
            member.email.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "paid"
          ? member.paidAmount > 0 || member.totalPaymentCount > 0
          : statusFilter === "partial"
          ? member.status === "partial"
          : statusFilter === "unpaid"
          ? member.status === "unpaid"
          : member.status === "overdue";

      return matchesSearch && matchesStatus;
    });
  }, [members, search, statusFilter]);

  const filteredRecentPayments = useMemo(() => {
    const q = recentSearch.trim().toLowerCase();

    return recentPayments.filter((item) => {
      if (q.length === 0) return true;

      return (
        item.memberDisplayName.toLowerCase().includes(q) ||
        item.memberEmail.toLowerCase().includes(q) ||
        item.periodLabel.toLowerCase().includes(q)
      );
    });
  }, [recentPayments, recentSearch]);

  const totalCollectedAmount = useMemo(
    () => recentPayments.reduce((sum, x) => sum + x.amount, 0),
    [recentPayments]
  );

  const totalExpectedAmount = useMemo(
    () => members.reduce((sum, x) => sum + x.expectedAmount, 0),
    [members]
  );

  const totalRemainingAmount = useMemo(
    () => members.reduce((sum, x) => sum + x.totalOpenDebt, 0),
    [members]
  );

  const collectionRate =
    totalExpectedAmount > 0 ? (totalCollectedAmount / totalExpectedAmount) * 100 : 0;

  const activePeriodLabel = useMemo(() => {
    if (!settings?.isEnabled || !settings.startDateUtc) return "—";

    const now = new Date();
    const start = new Date(settings.startDateUtc);

    if (settings.period === "Yearly") {
      return new Intl.DateTimeFormat("tr-TR", { year: "numeric" }).format(now);
    }

    if (now < start) {
      return formatMonthYear(settings.startDateUtc);
    }

    return new Intl.DateTimeFormat("tr-TR", {
      month: "long",
      year: "numeric",
    }).format(now);
  }, [settings]);

  const overdueCount = members.filter((x) => x.status === "overdue").length;
  const partialCount = members.filter((x) => x.status === "partial").length;
  const paidCount = members.filter((x) => x.status === "paid" || x.totalPaymentCount > 0).length;
  const unpaidCount = members.filter((x) => x.status === "unpaid").length;
  const neverPaidCount = members.filter((x) => x.totalPaymentCount === 0).length;

  const topDebtors = useMemo(() => {
    return [...members]
      .sort((a, b) => b.totalOpenDebt - a.totalOpenDebt)
      .slice(0, 50);
  }, [members]);

  const regularPayers = useMemo(() => {
    return [...members]
      .sort((a, b) => {
        if (b.totalPaymentCount !== a.totalPaymentCount) {
          return b.totalPaymentCount - a.totalPaymentCount;
        }

        const aDate = a.lastPaymentDate ? new Date(a.lastPaymentDate).getTime() : 0;
        const bDate = b.lastPaymentDate ? new Date(b.lastPaymentDate).getTime() : 0;

        return bDate - aDate;
      })
      .slice(0, 50);
  }, [members]);

  const neverPaidMembers = useMemo(() => {
    return members.filter((x) => x.totalPaymentCount === 0).slice(0, 50);
  }, [members]);

  const filteredTopDebtors = useMemo(() => {
    const q = topDebtorsSearch.trim().toLowerCase();

    return topDebtors.filter((member) => {
      if (q.length === 0) return true;

      return (
        member.displayName.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q)
      );
    });
  }, [topDebtors, topDebtorsSearch]);

  const filteredRegularPayers = useMemo(() => {
    const q = regularPayersSearch.trim().toLowerCase();

    return regularPayers.filter((member) => {
      if (q.length === 0) return true;

      return (
        member.displayName.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q)
      );
    });
  }, [regularPayers, regularPayersSearch]);

  const filteredNeverPaidMembers = useMemo(() => {
    const q = neverPaidSearch.trim().toLowerCase();

    return neverPaidMembers.filter((member) => {
      if (q.length === 0) return true;

      return (
        member.displayName.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q)
      );
    });
  }, [neverPaidMembers, neverPaidSearch]);

  async function loadMemberPeriods(
    memberId: string,
    options?: {
      yearValue?: string;
      showOpenOnly?: boolean;
    }
  ) {
    const yearValue = options?.yearValue ?? periodYearFilterByMember[memberId];
    const showOpenOnly = options?.showOpenOnly ?? (showOpenOnlyByMember[memberId] ?? true);

    const result = await getOrganizationMemberPaymentPeriods(organizationId, memberId, {
      year: yearValue ? Number(yearValue) : undefined,
      onlyOpen: false,
    });

    const rawRows: PaymentPeriodRow[] = result
      .map((x: OrganizationMemberPaymentPeriodDto) => ({
        id: x.id,
        periodYear: x.periodYear,
        periodMonth: x.periodMonth ?? null,
        periodLabel: x.periodLabel,
        periodStartUtc: x.periodStartUtc,
        periodType: x.periodType,
        expectedAmount: x.expectedAmount,
        paidAmount: x.paidAmount,
        remainingAmount: x.remainingAmount,
        currency: x.currency,
        status: x.status,
        isOverdue: x.isOverdue,
        isCurrentPeriod: x.isCurrentPeriod,
        paymentCount: x.paymentCount,
        lastPaidAtUtc: x.lastPaidAtUtc ?? null,
      }))
      .sort((a, b) => {
        if (a.periodYear !== b.periodYear) return a.periodYear - b.periodYear;
        return (a.periodMonth ?? 0) - (b.periodMonth ?? 0);
      });

    const filteredRows = rawRows.filter((row) => {
      const isPaidRow = row.status === "Paid" || row.remainingAmount <= 0;
      return showOpenOnly ? !isPaidRow : isPaidRow;
    });

    setPeriodsByMember((prev) => ({
      ...prev,
      [memberId]: filteredRows,
    }));

    const amountDrafts: Record<string, string> = {};
    for (const row of filteredRows) {
      amountDrafts[row.id] = row.remainingAmount > 0 ? String(row.remainingAmount) : "";
    }

    setPaymentAmountByPeriod((prev) => ({
      ...prev,
      ...amountDrafts,
    }));
  }

  async function toggleMember(memberId: string) {
    const isExpanded = expandedMemberIds.includes(memberId);

    if (isExpanded) {
      setExpandedMemberIds((prev) => prev.filter((x) => x != memberId));
      return;
    }

    setExpandedMemberIds((prev) => [...prev, memberId]);

    if (!periodsByMember[memberId]) {
      try {
        await loadMemberPeriods(memberId);
      } catch (error) {
        showToast({
          message: error instanceof Error ? error.message : "Dönemler yüklenemedi.",
          type: "error",
        });
      }
    }
  }

  async function handleRefreshMemberPeriods(memberId: string) {
    try {
      await loadMemberPeriods(memberId);
      showToast({
        message: "Dönem listesi yenilendi.",
        type: "info",
      });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Dönemler yüklenemedi.",
        type: "error",
      });
    }
  }

  async function handleYearFilterChange(memberId: string, value: string) {
    setPeriodYearFilterByMember((prev) => ({
      ...prev,
      [memberId]: value,
    }));

    if (expandedMemberIds.includes(memberId) && (value === "" || value.length === 4)) {
      try {
        await loadMemberPeriods(memberId, {
          yearValue: value,
          showOpenOnly: showOpenOnlyByMember[memberId] ?? true,
        });
      } catch (error) {
        showToast({
          message: error instanceof Error ? error.message : "Dönemler yüklenemedi.",
          type: "error",
        });
      }
    }
  }

  async function handleShowOpenOnlyToggle(memberId: string, nextValue: boolean) {
    setShowOpenOnlyByMember((prev) => ({
      ...prev,
      [memberId]: nextValue,
    }));

    if (expandedMemberIds.includes(memberId)) {
      try {
        await loadMemberPeriods(memberId, {
          yearValue: periodYearFilterByMember[memberId],
          showOpenOnly: nextValue,
        });
      } catch (error) {
        showToast({
          message: error instanceof Error ? error.message : "Dönemler yüklenemedi.",
          type: "error",
        });
      }
    }
  }

  async function handleSaveAll() {
    try {
      setIsSavingAll(true);

      const startDateIso = settingsForm.isEnabled
        ? buildIsoFromDateParts(
            settingsForm.startDay,
            settingsForm.startMonth,
            settingsForm.startYear,
            settingsForm.period
          )
        : null;

      if (settingsForm.isEnabled && !startDateIso) {
        showToast({
          message:
            settingsForm.period === "Yearly"
              ? "Geçerli bir başlangıç yılı seçmelisin."
              : "Geçerli bir başlangıç tarihi seçmelisin.",
          type: "error",
        });
        return;
      }

      if (settingsForm.isEnabled && planForm.amount.trim() === "") {
        showToast({
          message: "Aidat sistemi açıkken tutar zorunludur.",
          type: "error",
        });
        return;
      }

      const numericAmount =
        planForm.amount.trim() === "" ? null : Number(planForm.amount);

      if (settingsForm.isEnabled && (!Number.isFinite(numericAmount) || numericAmount! < 0)) {
        showToast({
          message: "Geçerli bir aidat tutarı gir.",
          type: "error",
        });
        return;
      }

      await upsertOrganizationPaymentSettings(organizationId, {
        isEnabled: settingsForm.isEnabled,
        period: settingsForm.period,
        amount: settingsForm.isEnabled ? numericAmount : null,
        currency: settingsForm.isEnabled ? planForm.currency : null,
        startDateUtc: startDateIso,
      });

      const selectedYear = settingsForm.startYear ? Number(settingsForm.startYear) : null;

      if (settingsForm.isEnabled && selectedYear && numericAmount !== null) {
        await upsertOrganizationPaymentPlan(organizationId, selectedYear, {
          period: settingsForm.period,
          amount: numericAmount,
          currency: planForm.currency,
          isActive: planForm.isActive,
        });
      }

      await Promise.all([
        loadSettingsAndPlans(),
        loadStatusesOnly(),
        loadRecentPaymentsOnly(),
      ]);

      setPeriodsByMember({});

      if (!settingsForm.isEnabled) {
        showToast({
          message: "Aidat sistemi kapatıldı.",
          type: "success",
        });
      } else if (settingsForm.period === "Monthly") {
        showToast({
          message: "Aidat sistemi aylık olarak güncellendi.",
          type: "success",
        });
      } else {
        showToast({
          message: "Aidat sistemi yıllık olarak güncellendi.",
          type: "success",
        });
      }
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Kayıt sırasında bir hata oluştu.",
        type: "error",
      });
    } finally {
      setIsSavingAll(false);
    }
  }

  function openPaymentConfirm(
    member: MemberRow,
    period: PaymentPeriodRow,
    amountText: string
  ) {
    const amount = Number(amountText);

    if (!Number.isFinite(amount) || amount <= 0) {
      showToast({
        message: "Geçerli bir ödeme tutarı gir.",
        type: "error",
      });
      return;
    }

    setPendingPayment({
      memberId: member.memberId,
      memberDisplayName: member.displayName,
      periodId: period.id,
      periodLabel: period.periodLabel,
      amount,
      currency: period.currency,
    });
  }

  async function confirmPayment() {
    if (!pendingPayment) return;

    try {
      setPayingPeriodId(pendingPayment.periodId);

      await payOrganizationMemberPeriod(
        organizationId,
        pendingPayment.memberId,
        pendingPayment.periodId,
        {
          amount: pendingPayment.amount,
          paidAtUtc: new Date().toISOString(),
          paymentMethod: "Cash" satisfies PaymentMethod,
          note: null,
        }
      );

      const memberId = pendingPayment.memberId;
      const memberName = pendingPayment.memberDisplayName;
      const periodName = pendingPayment.periodLabel;

      setPendingPayment(null);

      await Promise.all([
        loadStatusesOnly(),
        loadRecentPaymentsOnly(),
        loadMemberPeriods(memberId, {
          yearValue: periodYearFilterByMember[memberId],
          showOpenOnly: showOpenOnlyByMember[memberId] ?? true,
        }),
      ]);

      showToast({
        message: `${memberName} için ${periodName} ödemesi kaydedildi.`,
        type: "success",
      });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Ödeme kaydedilemedi.",
        type: "error",
      });
    } finally {
      setPayingPeriodId(null);
    }
  }

  const planDescription =
    settingsForm.period === "Yearly"
      ? "Bu alanda seçilen yıl için yıllık aidat tutarını belirlersin."
      : "Bu alanda seçilen yıl için aylık aidat tutarını belirlersin.";

  const planAmountLabel =
    settingsForm.period === "Yearly" ? "Yıllık tutar" : "Aylık tutar";

  const startDateLabel =
    settingsForm.period === "Yearly" ? "Başlangıç yılı" : "Başlangıç tarihi";

  const controlsDisabled = !settingsForm.isEnabled;

  return (
    <>
      <PaymentConfirmModal
        open={pendingPayment != null}
        memberDisplayName={pendingPayment?.memberDisplayName ?? ""}
        periodLabel={pendingPayment?.periodLabel ?? ""}
        amount={pendingPayment?.amount ?? 0}
        currency={pendingPayment?.currency ?? "TRY"}
        onCancel={() => setPendingPayment(null)}
        onConfirm={confirmPayment}
        isSubmitting={pendingPayment != null && payingPeriodId === pendingPayment.periodId}
      />

      <div className="space-y-6 rounded-[32px] bg-[#e5e7eb] p-3">
        <DashboardHeroCard
          collectionType={collectionType}
          activePeriodLabel={activePeriodLabel}
          totalCollectedAmount={totalCollectedAmount}
          totalExpectedAmount={totalExpectedAmount}
          collectionRate={collectionRate}
          currency={activeCurrency}
        />

        {pageError ? (
          <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {pageError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
          <StatCard
            title="Aidat Sistemi"
            value={getCollectionTypeLabel(collectionType)}
            subtitle={`Aktif dönem: ${activePeriodLabel}`}
            accentClass="bg-slate-900"
            onClick={() => setIsSettingsPanelOpen((prev) => !prev)}
            isActive={isSettingsPanelOpen}
            badge={isSettingsPanelOpen ? "Ayarlar açık" : settings?.isEnabled ? "Açık" : "Kapalı"}
          />

          <StatCard
            title="Ödeme Beklenen Üye"
            value={String(members.length)}
            subtitle={`Hiç ödeme yapmayan: ${neverPaidCount}`}
            accentClass="bg-sky-500"
          />

          <StatCard
            title="Tam Ödeyen"
            value={String(paidCount)}
            subtitle={`Tahsilat oranı: %${collectionRate.toFixed(0)}`}
            accentClass="bg-emerald-500"
          />

          <StatCard
            title="Kısmi Ödeyen"
            value={String(partialCount)}
            subtitle="Bu döneme ait eksik ödeme var"
            accentClass="bg-amber-500"
          />

          <StatCard
            title="Geciken Üye"
            value={String(overdueCount)}
            subtitle="Açık geçmiş dönem borcu bulunuyor"
            accentClass="bg-rose-500"
          />

          <StatCard
            title="Kalan Alacak"
            value={formatCurrency(totalRemainingAmount, activeCurrency)}
            subtitle={`Bekleyen: ${String(unpaidCount)}`}
            accentClass="bg-indigo-500"
          />
        </div>

        {isSettingsPanelOpen ? (
          <SectionCard
            title="Aidat Sistemi"
            description="Aidat tipini seç. Aylıkta tam tarih, yıllıkta sadece yıl esas alınır."
            rightSlot={
              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSavingAll}
                className="rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {isSavingAll ? "Uygulanıyor..." : "Aidat Ayarlarını Uygula"}
              </button>
            }
          >
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
              <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-sm font-medium text-slate-700">Aidat aktif</div>
                <select
                  value={settingsForm.isEnabled ? "true" : "false"}
                  onChange={(e) =>
                    setSettingsForm((prev) => ({
                      ...prev,
                      isEnabled: e.target.value === "true",
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                >
                  <option value="true">Açık</option>
                  <option value="false">Kapalı</option>
                </select>
              </label>

              <label
                className={`rounded-2xl border border-slate-200 bg-slate-50 p-3 ${
                  controlsDisabled ? "opacity-60" : ""
                }`}
              >
                <div className="text-sm font-medium text-slate-700">Aidat tipi</div>
                <select
                  value={settingsForm.period}
                  onChange={(e) => {
                    const nextPeriod = e.target.value as "Monthly" | "Yearly";

                    setSettingsForm((prev) => ({
                      ...prev,
                      period: nextPeriod,
                      startDay: "1",
                      startMonth: "1",
                    }));
                  }}
                  disabled={controlsDisabled}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="Monthly">Aylık</option>
                  <option value="Yearly">Yıllık</option>
                </select>
              </label>

              <div
                className={`rounded-2xl border border-slate-200 bg-slate-50 p-3 ${
                  controlsDisabled ? "opacity-60" : ""
                }`}
              >
                <div className="text-sm font-medium text-slate-700">{startDateLabel}</div>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  <select
                    value={settingsForm.startDay}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        startDay: e.target.value,
                      }))
                    }
                    disabled={controlsDisabled || settingsForm.period === "Yearly"}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {DAY_OPTIONS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>

                  <select
                    value={settingsForm.startMonth}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        startMonth: e.target.value,
                      }))
                    }
                    disabled={controlsDisabled || settingsForm.period === "Yearly"}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {MONTH_OPTIONS.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>

                  <select
                    value={settingsForm.startYear}
                    onChange={(e) =>
                      setSettingsForm((prev) => ({
                        ...prev,
                        startYear: e.target.value,
                      }))
                    }
                    disabled={controlsDisabled}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    {YEAR_OPTIONS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {settingsForm.period === "Yearly"
                    ? "Yıllık sistemde yalnızca başlangıç yılı esas alınır."
                    : "Borç üretimi bu tarihten itibaren başlar."}
                </p>
              </div>
            </div>

            <div
              className={`mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 ${
                controlsDisabled ? "opacity-60" : ""
              }`}
            >
              <div className="mb-3">
                <div className="text-sm font-semibold text-slate-900">Aidat Planı</div>
                <p className="mt-1 text-sm text-slate-500">{planDescription}</p>
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_0.9fr]">
                <label className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-sm font-medium text-slate-700">{planAmountLabel}</div>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={planForm.amount}
                    onChange={(e) =>
                      setPlanForm((prev) => ({ ...prev, amount: e.target.value }))
                    }
                    disabled={controlsDisabled}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                    placeholder="Tutar gir"
                  />
                </label>

                <label className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-sm font-medium text-slate-700">Para birimi</div>
                  <select
                    value={planForm.currency}
                    onChange={(e) =>
                      setPlanForm((prev) => ({
                        ...prev,
                        currency: e.target.value as "TRY" | "USD" | "EUR",
                      }))
                    }
                    disabled={controlsDisabled}
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="TRY">TRY</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                  Plan yılı: {settingsForm.startYear || "—"}
                </span>
                <span className="rounded-full bg-white px-3 py-1.5 shadow-sm">
                  Tip: {settingsForm.period === "Yearly" ? "Yıllık" : "Aylık"}
                </span>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="px-3 py-3">Yıl</th>
                      <th className="px-3 py-3">Tip</th>
                      <th className="px-3 py-3">Tutar</th>
                      <th className="px-3 py-3">Durum</th>
                      <th className="px-3 py-3">Güncellendi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {compatiblePlans.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-slate-500">
                          Bu aidat tipine uygun plan henüz tanımlanmadı.
                        </td>
                      </tr>
                    ) : (
                      compatiblePlans.map((plan) => (
                        <tr
                          key={plan.id}
                          className={`border-b border-slate-100 text-slate-700 ${
                            selectedPlanYear === plan.year ? "bg-slate-50" : ""
                          }`}
                        >
                          <td className="px-3 py-3 font-medium">{plan.year}</td>
                          <td className="px-3 py-3">
                            {plan.period === "Yearly" ? "Yıllık" : "Aylık"}
                          </td>
                          <td className="px-3 py-3">
                            {formatCurrency(plan.amount, plan.currency)}
                          </td>
                          <td className="px-3 py-3">{plan.isActive ? "Aktif" : "Pasif"}</td>
                          <td className="px-3 py-3">{formatDate(plan.updatedAtUtc)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </SectionCard>
        ) : null}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <SectionCard
              title="Üye Ödeme Durumları"
              description="Kartı açınca üyeye ait tüm borç dönemlerini görür, filtreler ve istediğin döneme ödeme işlersin."
              rightSlot={
                <div className="flex flex-col gap-2 md:flex-row">
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="İsim veya mail ile ara"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none md:w-72"
                  />

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none"
                  >
                    <option value="all">Tümü</option>
                    <option value="paid">Ödeyenler</option>
                    <option value="partial">Kısmi Ödeyenler</option>
                    <option value="unpaid">Bekleyenler</option>
                    <option value="overdue">Gecikenler</option>
                  </select>
                </div>
              }
            >
              {isLoading ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
                  Yükleniyor...
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-600">
                  Filtreye uygun üye bulunamadı.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMembers.map((member) => {
                    const isExpanded = expandedMemberIds.includes(member.memberId);
                    const memberPeriods = periodsByMember[member.memberId] ?? [];

                    return (
                      <div
                        key={member.memberId}
                        className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 shadow-sm"
                      >
                        <button
                          type="button"
                          onClick={() => toggleMember(member.memberId)}
                          className="w-full p-4 text-left transition hover:bg-white"
                        >
                          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="truncate text-base font-semibold text-slate-900">
                                  {member.displayName}
                                </h3>

                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${getStatusBadgeClass(
                                    member.status
                                  )}`}
                                >
                                  {getStatusLabel(member.status)}
                                </span>

                                {!member.isActive ? (
                                  <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                                    Pasif Üye
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-1 truncate text-sm text-slate-500">
                                {member.email}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                                <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                                  Rol: {member.role}
                                </span>
                                <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                                  Aktif borç dönemi: {member.currentDuePeriodLabel ?? "—"}
                                </span>
                                <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                                  Son ödeme: {formatDate(member.lastPaymentDate)}
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[520px]">
                              <CompactSummaryItem
                                label="Beklenen"
                                value={formatCurrency(member.expectedAmount, activeCurrency)}
                              />
                              <CompactSummaryItem
                                label="Bu dönem ödenen"
                                value={formatCurrency(member.paidAmount, activeCurrency)}
                              />
                              <CompactSummaryItem
                                label="Toplam açık borç"
                                value={formatCurrency(member.totalOpenDebt, activeCurrency)}
                              />
                              <CompactSummaryItem
                                label="Durum"
                                value={getStatusLabel(member.status)}
                              />
                            </div>
                          </div>
                        </button>

                        {isExpanded ? (
                          <div className="border-t border-slate-200 bg-white p-4">
                            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <label>
                                  <div className="mb-1 text-xs text-slate-500">Yıl filtresi</div>
                                  <input
                                    type="number"
                                    value={periodYearFilterByMember[member.memberId] ?? ""}
                                    onChange={(e) =>
                                      handleYearFilterChange(member.memberId, e.target.value)
                                    }
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                                    placeholder="2026"
                                  />
                                </label>

                                <label className="flex items-center gap-2 pt-6">
                                  <input
                                    type="checkbox"
                                    checked={showOpenOnlyByMember[member.memberId] ?? true}
                                    onChange={(e) =>
                                      handleShowOpenOnlyToggle(member.memberId, e.target.checked)
                                    }
                                  />
                                  <span className="text-sm text-slate-700">
                                    Sadece açık dönemler
                                  </span>
                                </label>

                                <div className="pt-5">
                                  <button
                                    type="button"
                                    onClick={() => handleRefreshMemberPeriods(member.memberId)}
                                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                                  >
                                    Dönemleri Yenile
                                  </button>
                                </div>
                              </div>
                            </div>

                            {memberPeriods.length === 0 ? (
                              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                                Bu filtreye uygun dönem kaydı bulunamadı.
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {memberPeriods.map((period) => (
                                  <div
                                    key={period.id}
                                    className="rounded-[22px] border border-slate-200 bg-slate-50 p-4 shadow-sm"
                                  >
                                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <div className="text-base font-semibold text-slate-900">
                                            {period.periodLabel}
                                          </div>

                                          <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${getPeriodStatusClass(
                                              period.status,
                                              period.isOverdue
                                            )}`}
                                          >
                                            {getPeriodStatusLabel(period.status, period.isOverdue)}
                                          </span>

                                          {period.isCurrentPeriod ? (
                                            <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                                              Aktif dönem
                                            </span>
                                          ) : null}
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                                          <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                                            Beklenen: {formatCurrency(period.expectedAmount, period.currency)}
                                          </span>
                                          <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                                            Ödenen: {formatCurrency(period.paidAmount, period.currency)}
                                          </span>
                                          <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                                            Kalan: {formatCurrency(period.remainingAmount, period.currency)}
                                          </span>
                                          <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                                            Kayıt: {period.paymentCount}
                                          </span>
                                          <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                                            Son ödeme: {formatDate(period.lastPaidAtUtc)}
                                          </span>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_auto]">
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={paymentAmountByPeriod[period.id] ?? ""}
                                          onChange={(e) =>
                                            setPaymentAmountByPeriod((prev) => ({
                                              ...prev,
                                              [period.id]: e.target.value,
                                            }))
                                          }
                                          placeholder="Ödeme tutarı"
                                          disabled={period.remainingAmount <= 0}
                                          className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none disabled:opacity-60"
                                        />

                                        <button
                                          type="button"
                                          onClick={() =>
                                            openPaymentConfirm(
                                              member,
                                              period,
                                              paymentAmountByPeriod[period.id] ?? ""
                                            )
                                          }
                                          disabled={
                                            payingPeriodId === period.id ||
                                            period.remainingAmount <= 0
                                          }
                                          className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                          {payingPeriodId === period.id
                                            ? "İşleniyor..."
                                            : period.remainingAmount <= 0
                                            ? "Tamamlandı"
                                            : "Bu Döneme Ödeme Al"}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-6">
            <SectionCard
              title="Son Tahsilatlar"
              description="Liste büyürse bölüm içinde scroll olur."
              rightSlot={
                <input
                  value={recentSearch}
                  onChange={(e) => setRecentSearch(e.target.value)}
                  placeholder="İsim veya mail ile ara"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none md:w-72"
                />
              }
            >
              <div className="max-h-[420px] overflow-y-auto pr-1">
                {filteredRecentPayments.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                    <div className="text-sm font-medium text-slate-700">
                      Henüz tahsilat kaydı yok
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredRecentPayments.map((payment) => (
                      <div
                        key={payment.paymentId}
                        className="rounded-[22px] border border-slate-200 bg-slate-50 p-3 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-slate-900">
                              {payment.memberDisplayName}
                            </div>
                            <div className="truncate text-xs text-slate-500">
                              {payment.memberEmail}
                            </div>
                          </div>

                          <div className="rounded-2xl bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm">
                            {formatCurrency(payment.amount, payment.currency)}
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                            {payment.periodLabel}
                          </span>
                          <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                            {payment.methodLabel}
                          </span>
                        </div>

                        <div className="mt-2 space-y-1 text-xs text-slate-500">
                          <div>Ödeme tarihi: {formatDate(payment.paidAt)}</div>
                          <div>İşaretleyen: {payment.markedByDisplayName}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SectionCard>

            <SectionCard
              title="En Yüksek Kalan Borç"
              description="Üye bazlı toplam açık borç listesi."
              rightSlot={
                <input
                  value={topDebtorsSearch}
                  onChange={(e) => setTopDebtorsSearch(e.target.value)}
                  placeholder="İsim veya mail ile ara"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none md:w-72"
                />
              }
            >
              <div className="max-h-[320px] overflow-y-auto pr-1">
                <div className="space-y-3">
                  {filteredTopDebtors.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      Filtreye uygun kayıt yok.
                    </div>
                  ) : (
                    filteredTopDebtors.map((member, index) => (
                      <div
                        key={member.memberId}
                        className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">
                              {index + 1}
                            </span>
                            <div className="truncate text-sm font-medium text-slate-900">
                              {member.displayName}
                            </div>
                          </div>
                          <div className="mt-1 truncate text-xs text-slate-500">
                            {member.email}
                          </div>
                        </div>

                        <div className="text-right text-sm font-semibold text-slate-900">
                          {formatCurrency(member.totalOpenDebt, activeCurrency)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Düzenli Ödeyenler"
              description="Son ödeme kayıt sayısına göre sıralanır."
              rightSlot={
                <input
                  value={regularPayersSearch}
                  onChange={(e) => setRegularPayersSearch(e.target.value)}
                  placeholder="İsim veya mail ile ara"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none md:w-72"
                />
              }
            >
              <div className="max-h-[280px] overflow-y-auto pr-1">
                <div className="space-y-3">
                  {filteredRegularPayers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      Filtreye uygun kayıt yok.
                    </div>
                  ) : (
                    filteredRegularPayers.map((member, index) => (
                      <div
                        key={member.memberId}
                        className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                              {index + 1}
                            </span>
                            <div className="truncate text-sm font-medium text-slate-900">
                              {member.displayName}
                            </div>
                          </div>
                          <div className="mt-1 text-xs text-slate-500">
                            Son ödeme: {formatDate(member.lastPaymentDate)}
                          </div>
                        </div>

                        <div className="text-right text-xs text-slate-500">
                          Ödeme kaydı: {member.totalPaymentCount}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title="Hiç Ödeme Yapmayanlar"
              description="İlk tahsilatı bekleyen üyeler."
              rightSlot={
                <input
                  value={neverPaidSearch}
                  onChange={(e) => setNeverPaidSearch(e.target.value)}
                  placeholder="İsim veya mail ile ara"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none md:w-72"
                />
              }
            >
              <div className="max-h-[280px] overflow-y-auto pr-1">
                <div className="space-y-3">
                  {filteredNeverPaidMembers.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                      Filtreye uygun kayıt yok.
                    </div>
                  ) : (
                    filteredNeverPaidMembers.map((member, index) => (
                      <div
                        key={member.memberId}
                        className="flex items-center justify-between gap-3 rounded-[22px] border border-slate-200 bg-slate-50 p-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-xs font-semibold text-white">
                              {index + 1}
                            </span>
                            <div className="truncate text-sm font-medium text-slate-900">
                              {member.displayName}
                            </div>
                          </div>
                          <div className="mt-1 truncate text-xs text-slate-500">
                            {member.email}
                          </div>
                        </div>

                        <div className="text-right text-xs text-slate-500">
                          Durum: {getStatusLabel(member.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        </div>

        <div className="hidden">{organizationId}</div>
      </div>
    </>
  );
}//
//