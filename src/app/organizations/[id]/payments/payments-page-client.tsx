"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addOrganizationPaymentPlanRevision,
  cancelOrganizationPayment,
  deleteOrganizationPaymentPlan,
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
  type RecentOrganizationMemberPaymentDto,
  type OrganizationPaymentSettingsDto,
  type PaymentMethod,
} from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import ActionConfirmModal from "@/components/ActionConfirmModal";
import PaymentDashboardHeroCard from "./_payments-components/payment-dashboard-hero-card";
import PaymentMembersSection from "./_payments-components/payment-members-section";
import PaymentSidePanels from "./_payments-components/payment-side-panels";
import PaymentStatCard from "./_payments-components/payment-stat-card";
import PaymentSettingsPanel from "./_payments-components/payment-settings-panel";
import {
  buildIsoFromDateParts,
  buildRevisionIsoFromDateParts,
  formatCurrency,
  formatMonthYear,
  formatYearOnly,
  getDateParts,
  getDefaultYearString,
  getCollectionTypeLabel,
  mapCollectionType,
  mapRecentPayments,
} from "./_payments-lib/payment-formatters";
import type {
  MemberPaymentStatus,
  MemberRow,
  PaymentPeriodRow,
  PendingPaymentCancelConfirm,
  PendingPaymentConfirm,
  PendingPlanDeleteConfirm,
  PlanFormState,
  RecentPaymentItem,
  RevisionFormState,
  SettingsFormState,
  StatusFilter,
} from "./_payments-lib/payment-page-types";

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
  const [pendingPlanDelete, setPendingPlanDelete] = useState<PendingPlanDeleteConfirm | null>(null);
  const [pendingPaymentCancel, setPendingPaymentCancel] =
    useState<PendingPaymentCancelConfirm | null>(null);

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

  const [revisionForm, setRevisionForm] = useState<RevisionFormState>({
    effectiveDay: "1",
    effectiveMonth: "1",
    effectiveYear: getDefaultYearString(),
    amount: "",
    currency: "TRY",
    isActive: true,
  });

  const [selectedPlanYear, setSelectedPlanYear] = useState<number | null>(null);
  const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);
  const [isRevisionPanelOpen, setIsRevisionPanelOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [deletingPlanYear, setDeletingPlanYear] = useState<number | null>(null);
  const [isAddingRevision, setIsAddingRevision] = useState(false);
  const [cancellingPaymentId, setCancellingPaymentId] = useState<string | null>(null);

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

    const latestRevision = currentYearPlan?.revisions?.length
      ? [...currentYearPlan.revisions].sort((a, b) => b.revisionNo - a.revisionNo)[0]
      : null;

    const revisionDateParts = getDateParts(
      latestRevision?.effectiveFromUtc ?? settingsResult.startDateUtc
    );

    setRevisionForm({
      effectiveDay: revisionDateParts.day,
      effectiveMonth: revisionDateParts.month,
      effectiveYear: revisionDateParts.year,
      amount: "",
      currency:
        latestRevision?.currency === "USD" || latestRevision?.currency === "EUR"
          ? latestRevision.currency
          : currentYearPlan?.currency === "USD" || currentYearPlan?.currency === "EUR"
          ? currentYearPlan.currency
          : "TRY",
      isActive: true,
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
      setRevisionForm({
        effectiveDay: "1",
        effectiveMonth: "1",
        effectiveYear: getDefaultYearString(),
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

    const latestRevision = currentPlan?.revisions?.length
      ? [...currentPlan.revisions].sort((a, b) => b.revisionNo - a.revisionNo)[0]
      : null;

    const revisionDateParts = getDateParts(
      latestRevision?.effectiveFromUtc ?? `${selectedYear}-01-01T00:00:00Z`
    );

    setRevisionForm({
      effectiveDay: revisionDateParts.day,
      effectiveMonth: revisionDateParts.month,
      effectiveYear: revisionDateParts.year,
      amount: "",
      currency:
        latestRevision?.currency === "USD" || latestRevision?.currency === "EUR"
          ? latestRevision.currency
          : currentPlan?.currency === "USD" || currentPlan?.currency === "EUR"
          ? currentPlan.currency
          : "TRY",
      isActive: true,
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

  const selectedPlan =
    selectedPlanYear != null ? compatiblePlanMap.get(selectedPlanYear) ?? null : null;

  const activePeriodInfo = useMemo(() => {
    if (!settings?.isEnabled || !settings.startDateUtc) {
      return {
        label: "—",
        planYear: null as number | null,
      };
    }

    const now = new Date();
    const start = new Date(settings.startDateUtc);

    if (settings.period === "Yearly") {
      return {
        label: new Intl.DateTimeFormat("tr-TR", { year: "numeric" }).format(now),
        planYear: now.getUTCFullYear(),
      };
    }

    if (now < start) {
      return {
        label: formatMonthYear(settings.startDateUtc),
        planYear: start.getUTCFullYear(),
      };
    }

    return {
      label: new Intl.DateTimeFormat("tr-TR", {
        month: "long",
        year: "numeric",
      }).format(now),
      planYear: now.getUTCFullYear(),
    };
  }, [settings]);

  const activePlan = useMemo(() => {
    if (!settings?.isEnabled || activePeriodInfo.planYear == null) return null;

    return (
      plans.find(
        (x) => x.period === settings.period && x.year === activePeriodInfo.planYear
      ) ?? null
    );
  }, [plans, settings, activePeriodInfo.planYear]);

  const activeCurrency =
    activePlan?.currency ??
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
    const currentPeriodExpectedAmount = activePlan?.amount ?? 0;

    return memberStatuses.map((item) => {
      const paidAmount = item.currentPeriodPaidAmount ?? 0;
      const remainingAmount = Math.max(currentPeriodExpectedAmount - paidAmount, 0);
      const totalOpenDebt = item.totalOutstandingAmount ?? remainingAmount;
      const paymentMetric = recentPaymentMetrics.get(item.email);

      let status: MemberPaymentStatus;
      if (item.isOverdue && paidAmount > 0) status = "partial";
      else if (item.isOverdue) status = "overdue";
      else if (paidAmount >= currentPeriodExpectedAmount && currentPeriodExpectedAmount > 0)
        status = "paid";
      else if (paidAmount > 0) status = "partial";
      else status = "unpaid";

      return {
        memberId: item.organizationMemberId,
        displayName: item.email,
        email: item.email,
        role: item.role,
        isActive: item.isMemberActive,
        status,
        expectedAmount: currentPeriodExpectedAmount,
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
  }, [memberStatuses, recentPaymentMetrics, settingsForm.period, activePlan]);

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
    () => members.reduce((sum, x) => sum + x.paidAmount, 0),
    [members]
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

  const activePeriodLabel = activePeriodInfo.label;

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

  const getPlanForPeriod = useCallback(
    (period: PaymentPeriodRow) => {
      return (
        plans.find(
          (x) =>
            x.year === period.periodYear &&
            x.period ===
              (period.periodType === "Yearly" ? "Yearly" : "Monthly")
        ) ?? null
      );
    },
    [plans]
  );

  const getEffectiveRevisionForPeriod = useCallback(
    (period: PaymentPeriodRow) => {
      const plan = getPlanForPeriod(period);
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
    },
    [getPlanForPeriod]
  );

  const getRevisionNotice = useCallback(
    (period: PaymentPeriodRow) => {
      const plan = getPlanForPeriod(period);
      const effectiveRevision = getEffectiveRevisionForPeriod(period);

      if (!plan || !effectiveRevision) return null;
      if (!plan.revisions || plan.revisions.length <= 1) return null;
      if (effectiveRevision.revisionNo <= 1) return null;
      if (period.paidAmount <= 0) return null;
      if (period.remainingAmount <= 0) return null;

      return `Bu dönemde plan revizyonu uygulandı. Daha önce yapılan ödeme sonrası ${formatCurrency(
        period.remainingAmount,
        period.currency
      )} fark borç oluştu.`;
    },
    [getEffectiveRevisionForPeriod, getPlanForPeriod]
  );

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

  const refreshExpandedMemberPeriods = useCallback(async () => {
    if (expandedMemberIds.length === 0) return;

    await Promise.allSettled(
      expandedMemberIds.map((memberId) =>
        loadMemberPeriods(memberId, {
          yearValue: periodYearFilterByMember[memberId],
          showOpenOnly: showOpenOnlyByMember[memberId] ?? true,
        })
      )
    );
  }, [expandedMemberIds, periodYearFilterByMember, showOpenOnlyByMember]);

  async function toggleMember(memberId: string) {
    const isExpanded = expandedMemberIds.includes(memberId);

    if (isExpanded) {
      setExpandedMemberIds((prev) => prev.filter((x) => x !== memberId));
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

      await Promise.all([loadSettingsAndPlans(), loadStatusesOnly()]);
      await refreshExpandedMemberPeriods();

      showToast({
        message: !settingsForm.isEnabled
          ? "Aidat sistemi kapatıldı."
          : settingsForm.period === "Monthly"
          ? "Aidat sistemi aylık olarak güncellendi."
          : "Aidat sistemi yıllık olarak güncellendi.",
        type: "success",
      });
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Kayıt sırasında bir hata oluştu.",
        type: "error",
      });
    } finally {
      setIsSavingAll(false);
    }
  }

  async function handleAddRevision() {
    try {
      const selectedYear = settingsForm.startYear ? Number(settingsForm.startYear) : null;

      if (!selectedYear) {
        showToast({
          message: "Önce geçerli bir plan yılı seçmelisin.",
          type: "error",
        });
        return;
      }

      if (!selectedPlan || selectedPlan.year !== selectedYear) {
        showToast({
          message: "Revizyon eklemek için önce o yılın planı kayıtlı olmalı.",
          type: "error",
        });
        return;
      }

      if (!revisionForm.amount.trim()) {
        showToast({
          message: "Revizyon tutarı zorunludur.",
          type: "error",
        });
        return;
      }

      const numericAmount = Number(revisionForm.amount);
      if (!Number.isFinite(numericAmount) || numericAmount < 0) {
        showToast({
          message: "Geçerli bir revizyon tutarı gir.",
          type: "error",
        });
        return;
      }

      const effectiveFromUtc = buildRevisionIsoFromDateParts(
        revisionForm.effectiveDay,
        revisionForm.effectiveMonth,
        revisionForm.effectiveYear,
        settingsForm.period
      );

      if (!effectiveFromUtc) {
        showToast({
          message:
            settingsForm.period === "Yearly"
              ? "Geçerli bir revizyon tarihi seç."
              : "Geçerli bir revizyon başlangıç tarihi seç.",
          type: "error",
        });
        return;
      }

      setIsAddingRevision(true);

      await addOrganizationPaymentPlanRevision(organizationId, selectedYear, {
        effectiveFromUtc,
        amount: numericAmount,
        currency: revisionForm.currency,
        isActive: revisionForm.isActive,
      });

      await Promise.all([loadSettingsAndPlans(), loadStatusesOnly()]);
      await refreshExpandedMemberPeriods();

      setRevisionForm((prev) => ({
        ...prev,
        amount: "",
      }));

      showToast({
        message:
          settingsForm.period === "Yearly"
            ? `${selectedYear} yılı için yeni yıllık revizyon eklendi.`
            : `${selectedYear} yılı için yeni aylık revizyon eklendi.`,
        type: "success",
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "Revizyon eklenemedi.",
        type: "error",
      });
    } finally {
      setIsAddingRevision(false);
    }
  }

  function requestDeletePlan(plan: OrganizationPaymentPlanDto) {
    setPendingPlanDelete({
      year: plan.year,
      period: plan.period,
    });
  }

  async function confirmDeletePlan() {
    if (!pendingPlanDelete) return;

    try {
      setDeletingPlanYear(pendingPlanDelete.year);

      await deleteOrganizationPaymentPlan(organizationId, pendingPlanDelete.year);

      await Promise.all([loadSettingsAndPlans(), loadStatusesOnly()]);
      await refreshExpandedMemberPeriods();

      showToast({
        message: `${pendingPlanDelete.year} aidat planı silindi.`,
        type: "success",
      });

      setPendingPlanDelete(null);
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "Aidat planı silinemedi.",
        type: "error",
      });
    } finally {
      setDeletingPlanYear(null);
    }
  }

  function requestCancelPayment(payment: RecentPaymentItem) {
    if (payment.status === "Cancelled") return;

    setPendingPaymentCancel({
      paymentId: payment.paymentId,
      memberDisplayName: payment.memberDisplayName,
      periodLabel: payment.periodLabel,
      amount: payment.amount,
      currency: payment.currency,
    });
  }

  async function confirmCancelPayment() {
    if (!pendingPaymentCancel) return;

    try {
      setCancellingPaymentId(pendingPaymentCancel.paymentId);

      await cancelOrganizationPayment(organizationId, pendingPaymentCancel.paymentId);

      await Promise.all([loadStatusesOnly(), loadRecentPaymentsOnly()]);
      await refreshExpandedMemberPeriods();

      showToast({
        message: `${pendingPaymentCancel.memberDisplayName} için ${pendingPaymentCancel.periodLabel} ödeme kaydı iptal edildi.`,
        type: "success",
      });

      setPendingPaymentCancel(null);
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Ödeme kaydı iptal edilemedi.",
        type: "error",
      });
    } finally {
      setCancellingPaymentId(null);
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

  const controlsDisabled = !settingsForm.isEnabled;

  return (
    <>
      <ActionConfirmModal
        open={pendingPayment != null}
        title="Ödeme Onayı"
        description={
          pendingPayment
            ? `${pendingPayment.memberDisplayName} için ${pendingPayment.periodLabel} dönemine ${formatCurrency(
                pendingPayment.amount,
                pendingPayment.currency
              )} ödeme kaydı oluşturulacak.`
            : ""
        }
        warningText="Bu işlem ödeme geçmişine yansıyacaktır. Devam etmek istediğine emin misin?"
        confirmText="Ödemeyi Onayla"
        cancelText="Vazgeç"
        confirmTone="default"
        isSubmitting={pendingPayment != null && payingPeriodId === pendingPayment.periodId}
        onCancel={() => setPendingPayment(null)}
        onConfirm={confirmPayment}
      />

      <ActionConfirmModal
        open={pendingPlanDelete != null}
        title="Aidat Planı Silme Onayı"
        description={
          pendingPlanDelete
            ? `${pendingPlanDelete.year} ${
                pendingPlanDelete.period === "Yearly" ? "yıllık" : "aylık"
              } aidat planı silinecek.`
            : ""
        }
        warningText="Bu işlem planı ve bu plana bağlı borç üretimini etkiler. Bu yıl için ödeme alınmış planlar zaten silinemez."
        confirmText="Planı Sil"
        cancelText="Vazgeç"
        confirmTone="danger"
        isSubmitting={pendingPlanDelete != null && deletingPlanYear === pendingPlanDelete.year}
        onCancel={() => setPendingPlanDelete(null)}
        onConfirm={confirmDeletePlan}
      />

      <ActionConfirmModal
        open={pendingPaymentCancel != null}
        title="Ödeme İptal Onayı"
        description={
          pendingPaymentCancel
            ? `${pendingPaymentCancel.memberDisplayName} için ${pendingPaymentCancel.periodLabel} dönemine ait ${formatCurrency(
                pendingPaymentCancel.amount,
                pendingPaymentCancel.currency
              )} ödeme kaydı iptal edilecek.`
            : ""
        }
        warningText="Bu işlem ödeme kaydını silmez, iptal durumuna alır. İlgili dönemin borcu yeniden açılabilir."
        confirmText="Ödemeyi İptal Et"
        cancelText="Vazgeç"
        confirmTone="danger"
        isSubmitting={
          pendingPaymentCancel != null &&
          cancellingPaymentId === pendingPaymentCancel.paymentId
        }
        onCancel={() => setPendingPaymentCancel(null)}
        onConfirm={confirmCancelPayment}
      />

      <div className="space-y-6 rounded-[32px] bg-[#e5e7eb] p-3">
        <PaymentDashboardHeroCard
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
          <PaymentStatCard
            title="Aidat Sistemi"
            value={getCollectionTypeLabel(collectionType)}
            subtitle={`Aktif dönem: ${activePeriodLabel}`}
            accentClass="bg-slate-900"
            onClick={() => setIsSettingsPanelOpen((prev) => !prev)}
            isActive={isSettingsPanelOpen}
            badge={isSettingsPanelOpen ? "Ayarlar açık" : settings?.isEnabled ? "Açık" : "Kapalı"}
          />
          <PaymentStatCard
            title="Ödeme Beklenen Üye"
            value={String(members.length)}
            subtitle={`Hiç ödeme yapmayan: ${neverPaidCount}`}
            accentClass="bg-sky-500"
          />
          <PaymentStatCard
            title="Tam Ödeyen"
            value={String(paidCount)}
            subtitle={`Tahsilat oranı: %${collectionRate.toFixed(0)}`}
            accentClass="bg-emerald-500"
          />
          <PaymentStatCard
            title="Kısmi Ödeyen"
            value={String(partialCount)}
            subtitle="Bu döneme ait eksik ödeme var"
            accentClass="bg-amber-500"
          />
          <PaymentStatCard
            title="Geciken Üye"
            value={String(overdueCount)}
            subtitle="Açık geçmiş dönem borcu bulunuyor"
            accentClass="bg-rose-500"
          />
          <PaymentStatCard
            title="Kalan Alacak"
            value={formatCurrency(totalRemainingAmount, activeCurrency)}
            subtitle={`Bekleyen: ${String(unpaidCount)}`}
            accentClass="bg-indigo-500"
          />
        </div>

        <PaymentSettingsPanel
          isOpen={isSettingsPanelOpen}
          isSavingAll={isSavingAll}
          isAddingRevision={isAddingRevision}
          controlsDisabled={controlsDisabled}
          settingsForm={settingsForm}
          planForm={planForm}
          revisionForm={revisionForm}
          compatiblePlans={compatiblePlans}
          selectedPlanYear={selectedPlanYear}
          selectedPlan={selectedPlan}
          deletingPlanYear={deletingPlanYear}
          isRevisionPanelOpen={isRevisionPanelOpen}
          onToggleOpen={() => setIsSettingsPanelOpen((prev) => !prev)}
          onSaveAll={handleSaveAll}
          onSettingsFormChange={setSettingsForm}
          onPlanFormChange={setPlanForm}
          onRevisionFormChange={setRevisionForm}
          onToggleRevisionPanel={() => setIsRevisionPanelOpen((prev) => !prev)}
          onAddRevision={handleAddRevision}
          onDeletePlan={requestDeletePlan}
        />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <PaymentMembersSection
              isLoading={isLoading}
              filteredMembers={filteredMembers}
              search={search}
              statusFilter={statusFilter}
              activeCurrency={activeCurrency}
              expandedMemberIds={expandedMemberIds}
              periodsByMember={periodsByMember}
              periodYearFilterByMember={periodYearFilterByMember}
              showOpenOnlyByMember={showOpenOnlyByMember}
              paymentAmountByPeriod={paymentAmountByPeriod}
              payingPeriodId={payingPeriodId}
              onSearchChange={setSearch}
              onStatusFilterChange={setStatusFilter}
              onToggleMember={toggleMember}
              onYearFilterChange={handleYearFilterChange}
              onShowOpenOnlyToggle={handleShowOpenOnlyToggle}
              onRefreshMemberPeriods={handleRefreshMemberPeriods}
              onPaymentAmountChange={(periodId, value) =>
                setPaymentAmountByPeriod((prev) => ({
                  ...prev,
                  [periodId]: value,
                }))
              }
              onOpenPaymentConfirm={openPaymentConfirm}
              getRevisionNotice={getRevisionNotice}
            />
          </div>

          <PaymentSidePanels
            filteredRecentPayments={filteredRecentPayments}
            filteredTopDebtors={filteredTopDebtors}
            filteredRegularPayers={filteredRegularPayers}
            filteredNeverPaidMembers={filteredNeverPaidMembers}
            recentSearch={recentSearch}
            topDebtorsSearch={topDebtorsSearch}
            regularPayersSearch={regularPayersSearch}
            neverPaidSearch={neverPaidSearch}
            activeCurrency={activeCurrency}
            cancellingPaymentId={cancellingPaymentId}
            onRecentSearchChange={setRecentSearch}
            onTopDebtorsSearchChange={setTopDebtorsSearch}
            onRegularPayersSearchChange={setRegularPayersSearch}
            onNeverPaidSearchChange={setNeverPaidSearch}
            onRequestCancelPayment={requestCancelPayment}
          />
        </div>

        <div className="hidden">{organizationId}</div>
      </div>
    </>
  );
}