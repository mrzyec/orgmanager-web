import type {
  OrganizationMemberPaymentStatusDto,
  OrganizationPaymentPlanDto,
} from "@/lib/api";
import {
  formatCurrency,
  formatMonthYear,
  formatYearOnly,
} from "./payment-formatters";
import type {
  MemberPaymentStatus,
  MemberRow,
  PaymentPeriodRow,
  RecentPaymentItem,
} from "./payment-page-types";

export function buildRecentPaymentMetrics(recentPayments: RecentPaymentItem[]) {
  const map = new Map<
    string,
    {
      count: number;
      lastPaidAt: string | null;
    }
  >();

  for (const payment of recentPayments) {
    const current = map.get(payment.memberEmail) ?? {
      count: 0,
      lastPaidAt: null,
    };

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
}

export function buildMembers(params: {
  memberStatuses: OrganizationMemberPaymentStatusDto[];
  recentPaymentMetrics: Map<
    string,
    {
      count: number;
      lastPaidAt: string | null;
    }
  >;
  activePlanAmount: number;
  settingsPeriod: "Monthly" | "Yearly";
}): MemberRow[] {
  const {
    memberStatuses,
    recentPaymentMetrics,
    activePlanAmount,
    settingsPeriod,
  } = params;

  return memberStatuses.map((item) => {
    const paidAmount = item.currentPeriodPaidAmount ?? 0;
    const remainingAmount = Math.max(activePlanAmount - paidAmount, 0);
    const totalOpenDebt = item.totalOutstandingAmount ?? remainingAmount;
    const paymentMetric = recentPaymentMetrics.get(item.email);

    let status: MemberPaymentStatus;

    if (item.isOverdue && paidAmount > 0) status = "partial";
    else if (item.isOverdue) status = "overdue";
    else if (paidAmount >= activePlanAmount && activePlanAmount > 0) status = "paid";
    else if (paidAmount > 0) status = "partial";
    else status = "unpaid";

    return {
      memberId: item.organizationMemberId,
      displayName: item.email,
      email: item.email,
      role: item.role,
      isActive: item.isMemberActive,
      status,
      expectedAmount: activePlanAmount,
      paidAmount,
      remainingAmount,
      totalOpenDebt,
      lastPaymentDate: paymentMetric?.lastPaidAt ?? item.lastPaidAtUtc ?? null,
      currentDueDate: item.nextDueDateUtc ?? null,
      currentDuePeriodLabel:
        settingsPeriod === "Yearly"
          ? item.nextDueDateUtc
            ? formatYearOnly(item.nextDueDateUtc)
            : "—"
          : formatMonthYear(item.nextDueDateUtc ?? null),
      overduePeriods: item.overduePeriodCount ?? (item.isOverdue ? 1 : 0),
      totalPaymentCount: paymentMetric?.count ?? 0,
    };
  });
}

export function filterMembers(params: {
  members: MemberRow[];
  search: string;
  statusFilter: "all" | "paid" | "partial" | "unpaid" | "overdue";
}) {
  const { members, search, statusFilter } = params;
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
}

export function filterRecentPayments(recentPayments: RecentPaymentItem[], search: string) {
  const q = search.trim().toLowerCase();

  return recentPayments.filter((item) => {
    if (q.length === 0) return true;

    return (
      item.memberDisplayName.toLowerCase().includes(q) ||
      item.memberEmail.toLowerCase().includes(q) ||
      item.periodLabel.toLowerCase().includes(q)
    );
  });
}

export function calculateSummaryStats(members: MemberRow[]) {
  const totalCollectedAmount = members.reduce((sum, x) => sum + x.paidAmount, 0);
  const totalExpectedAmount = members.reduce((sum, x) => sum + x.expectedAmount, 0);
  const totalRemainingAmount = members.reduce((sum, x) => sum + x.totalOpenDebt, 0);

  const collectionRate =
    totalExpectedAmount > 0 ? (totalCollectedAmount / totalExpectedAmount) * 100 : 0;

  const overdueCount = members.filter((x) => x.status === "overdue").length;
  const partialCount = members.filter((x) => x.status === "partial").length;
  const paidCount = members.filter(
    (x) => x.status === "paid" || x.totalPaymentCount > 0
  ).length;
  const unpaidCount = members.filter((x) => x.status === "unpaid").length;
  const neverPaidCount = members.filter((x) => x.totalPaymentCount === 0).length;

  return {
    totalCollectedAmount,
    totalExpectedAmount,
    totalRemainingAmount,
    collectionRate,
    overdueCount,
    partialCount,
    paidCount,
    unpaidCount,
    neverPaidCount,
  };
}

export function buildTopDebtors(members: MemberRow[]) {
  return [...members]
    .sort((a, b) => b.totalOpenDebt - a.totalOpenDebt)
    .slice(0, 50);
}

export function buildRegularPayers(members: MemberRow[]) {
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
}

export function buildNeverPaidMembers(members: MemberRow[]) {
  return members.filter((x) => x.totalPaymentCount === 0).slice(0, 50);
}

export function filterMemberListByQuery(list: MemberRow[], search: string) {
  const q = search.trim().toLowerCase();

  return list.filter((member) => {
    if (q.length === 0) return true;

    return (
      member.displayName.toLowerCase().includes(q) ||
      member.email.toLowerCase().includes(q)
    );
  });
}

export function getPlanForPeriod(
  plans: OrganizationPaymentPlanDto[],
  period: PaymentPeriodRow
) {
  return (
    plans.find(
      (x) =>
        x.year === period.periodYear &&
        x.period === (period.periodType === "Yearly" ? "Yearly" : "Monthly")
    ) ?? null
  );
}

export function getEffectiveRevisionForPeriod(
  plans: OrganizationPaymentPlanDto[],
  period: PaymentPeriodRow
) {
  const plan = getPlanForPeriod(plans, period);
  if (!plan?.revisions?.length) return null;

  const revisions = [...plan.revisions]
    .filter((x) => x.isActive)
    .sort((a, b) => {
      const aTime = new Date(a.effectiveFromUtc).getTime();
      const bTime = new Date(b.effectiveFromUtc).getTime();
      if (aTime !== bTime) return aTime - bTime;
      return a.revisionNo - b.revisionNo;
    });

  if (revisions.length === 0) return null;

  if (period.periodType === "Yearly") {
    return revisions[revisions.length - 1];
  }

  const periodStart = new Date(period.periodStartUtc).getTime();

  return (
    [...revisions]
      .reverse()
      .find((revision) => new Date(revision.effectiveFromUtc).getTime() <= periodStart) ??
    revisions[0]
  );
}

export function getRevisionNotice(
  plans: OrganizationPaymentPlanDto[],
  period: PaymentPeriodRow
) {
  const plan = getPlanForPeriod(plans, period);
  const effectiveRevision = getEffectiveRevisionForPeriod(plans, period);

  if (!plan || !effectiveRevision) return null;
  if (!plan.revisions || plan.revisions.length <= 1) return null;
  if (effectiveRevision.revisionNo <= 1) return null;
  if (period.paidAmount <= 0) return null;
  if (period.remainingAmount <= 0) return null;

  return `Bu dönemde plan revizyonu uygulandı. Daha önce yapılan ödeme sonrası ${formatCurrency(
    period.remainingAmount,
    period.currency
  )} fark borç oluştu.`;
}