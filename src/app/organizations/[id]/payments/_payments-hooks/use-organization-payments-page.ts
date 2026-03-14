"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addOrganizationPaymentPlanRevision,
  cancelOrganizationMemberPeriodLastPayment,
  cancelOrganizationPayment,
  deleteOrganizationPaymentPlan,
  getOrganizationMemberPaymentPeriods,
  getOrganizationMemberPaymentStatuses,
  getOrganizationPaymentPlans,
  getOrganizationPaymentSettings,
  getRecentOrganizationPayments,
  payOrganizationMemberPeriod,
  rollbackAndDeleteOrganizationPaymentPlan,
  upsertOrganizationPaymentPlan,
  upsertOrganizationPaymentSettings,
  type OrganizationMemberPaymentPeriodDto,
  type OrganizationMemberPaymentStatusDto,
  type OrganizationPaymentPlanDto,
  type OrganizationPaymentSettingsDto,
  type PaymentCancellationReasonCode,
  type PaymentMethod,
} from "@/lib/api";
import {
  buildIsoFromDateParts,
  buildRevisionIsoFromDateParts,
  getCollectionTypeLabel,
  getDateParts,
  getDefaultYearString,
  mapCollectionType,
  mapRecentPayments,
} from "../_payments-lib/payment-formatters";
import {
  buildMembers,
  buildNeverPaidMembers,
  buildRecentPaymentMetrics,
  buildRegularPayers,
  buildTopDebtors,
  calculateSummaryStats,
  filterMemberListByQuery,
  filterMembers,
  filterRecentPayments,
  getRevisionNotice as buildRevisionNotice,
} from "../_payments-lib/payment-selectors";
import type {
  PendingPaymentCancelConfirm,
  PendingPaymentConfirm,
  PendingPlanDeleteConfirm,
  PlanDeleteMode,
  PlanFormState,
  PaymentPeriodRow,
  RecentPaymentItem,
  RecentPaymentStatusFilter,
  RevisionFormState,
  SettingsFormState,
  StatusFilter,
} from "../_payments-lib/payment-page-types";

type Params = {
  organizationId: string;
  showToast: (args: { message: string; type: "success" | "error" | "info" }) => void;
};

type PaymentCancellationReasonSelection = PaymentCancellationReasonCode | "";

const DEFAULT_PLAN_ROLLBACK_REASON: PaymentCancellationReasonCode = "WrongPaymentPlan";

function isPlanLockedForDirectUpdateError(message: string) {
  const normalized = message.toLocaleLowerCase("tr-TR");

  return (
    normalized.includes("mevcut aidat planı doğrudan güncellenemez") ||
    normalized.includes("plan revizyonu eklemelisin") ||
    normalized.includes("revizyon kullanmalisin") ||
    normalized.includes("revizyon kullanmalısın")
  );
}

export function useOrganizationPaymentsPage({
  organizationId,
  showToast,
}: Params) {
  const [search, setSearch] = useState("");
  const [recentSearch, setRecentSearch] = useState("");
  const [recentPaymentStatusFilter, setRecentPaymentStatusFilter] =
    useState<RecentPaymentStatusFilter>("all");
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

  const [planDeleteMode, setPlanDeleteMode] = useState<PlanDeleteMode>("delete");
  const [planDeleteReasonCode, setPlanDeleteReasonCode] =
    useState<PaymentCancellationReasonCode>(DEFAULT_PLAN_ROLLBACK_REASON);
  const [planDeleteNote, setPlanDeleteNote] = useState("");

  const [paymentCancelReasonCode, setPaymentCancelReasonCode] =
    useState<PaymentCancellationReasonSelection>("");
  const [paymentCancelNote, setPaymentCancelNote] = useState("");

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
        label: new Intl.DateTimeFormat("tr-TR", {
          month: "long",
          year: "numeric",
        }).format(start),
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

  const recentPaymentMetrics = useMemo(
    () => buildRecentPaymentMetrics(recentPayments),
    [recentPayments]
  );

  const members = useMemo(
    () =>
      buildMembers({
        memberStatuses,
        recentPaymentMetrics,
        activePlanAmount: activePlan?.amount ?? 0,
        settingsPeriod: settingsForm.period,
      }),
    [activePlan, memberStatuses, recentPaymentMetrics, settingsForm.period]
  );

  const filteredMembers = useMemo(
    () =>
      filterMembers({
        members,
        search,
        statusFilter,
      }),
    [members, search, statusFilter]
  );

  const filteredRecentPayments = useMemo(() => {
    const searched = filterRecentPayments(recentPayments, recentSearch);

    if (recentPaymentStatusFilter === "completed") {
      return searched.filter((x) => x.status === "Completed");
    }

    if (recentPaymentStatusFilter === "cancelled") {
      return searched.filter((x) => x.status === "Cancelled");
    }

    return searched;
  }, [recentPayments, recentSearch, recentPaymentStatusFilter]);

  const {
    totalCollectedAmount,
    totalExpectedAmount,
    totalRemainingAmount,
    collectionRate,
    overdueCount,
    partialCount,
    paidCount,
    unpaidCount,
    neverPaidCount,
  } = useMemo(() => calculateSummaryStats(members), [members]);

  const topDebtors = useMemo(() => buildTopDebtors(members), [members]);
  const regularPayers = useMemo(() => buildRegularPayers(members), [members]);
  const neverPaidMembers = useMemo(() => buildNeverPaidMembers(members), [members]);

  const filteredTopDebtors = useMemo(
    () => filterMemberListByQuery(topDebtors, topDebtorsSearch),
    [topDebtors, topDebtorsSearch]
  );

  const filteredRegularPayers = useMemo(
    () => filterMemberListByQuery(regularPayers, regularPayersSearch),
    [regularPayers, regularPayersSearch]
  );

  const filteredNeverPaidMembers = useMemo(
    () => filterMemberListByQuery(neverPaidMembers, neverPaidSearch),
    [neverPaidMembers, neverPaidSearch]
  );

  const getRevisionNotice = useCallback(
    (period: PaymentPeriodRow) => buildRevisionNotice(plans, period),
    [plans]
  );

  const loadMemberPeriods = useCallback(
    async (
      memberId: string,
      options?: {
        yearValue?: string;
        showOpenOnly?: boolean;
      }
    ) => {
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
    },
    [organizationId, periodYearFilterByMember, showOpenOnlyByMember]
  );

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
  }, [expandedMemberIds, loadMemberPeriods, periodYearFilterByMember, showOpenOnlyByMember]);

  const toggleMember = useCallback(
    async (memberId: string) => {
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
    },
    [expandedMemberIds, loadMemberPeriods, periodsByMember, showToast]
  );

  const handleRefreshMemberPeriods = useCallback(
    async (memberId: string) => {
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
    },
    [loadMemberPeriods, showToast]
  );

  const handleYearFilterChange = useCallback(
    async (memberId: string, value: string) => {
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
    },
    [expandedMemberIds, loadMemberPeriods, showOpenOnlyByMember, showToast]
  );

  const handleShowOpenOnlyToggle = useCallback(
    async (memberId: string, nextValue: boolean) => {
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
    },
    [expandedMemberIds, loadMemberPeriods, periodYearFilterByMember, showToast]
  );

  const handleSaveAll = useCallback(async () => {
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

      let planUpdateSkippedBecauseRevisionIsRequired = false;

      const selectedYear = settingsForm.startYear ? Number(settingsForm.startYear) : null;

      if (settingsForm.isEnabled && selectedYear && numericAmount !== null) {
        const existingPlan = plans.find(
          (x) => x.year === selectedYear && x.period === settingsForm.period
        );

        const shouldCreatePlan = !existingPlan;
        const shouldUpdatePlan =
          !!existingPlan &&
          (
            existingPlan.amount !== numericAmount ||
            existingPlan.currency !== planForm.currency ||
            existingPlan.isActive !== planForm.isActive
          );

        if (shouldCreatePlan) {
          await upsertOrganizationPaymentPlan(organizationId, selectedYear, {
            period: settingsForm.period,
            amount: numericAmount,
            currency: planForm.currency,
            isActive: planForm.isActive,
          });
        } else if (shouldUpdatePlan) {
          try {
            await upsertOrganizationPaymentPlan(organizationId, selectedYear, {
              period: settingsForm.period,
              amount: numericAmount,
              currency: planForm.currency,
              isActive: planForm.isActive,
            });
          } catch (error) {
            if (
              error instanceof Error &&
              isPlanLockedForDirectUpdateError(error.message)
            ) {
              planUpdateSkippedBecauseRevisionIsRequired = true;
            } else {
              throw error;
            }
          }
        }
      }

      await Promise.all([
        loadSettingsAndPlans(),
        loadStatusesOnly(),
        loadRecentPaymentsOnly(),
      ]);
      await refreshExpandedMemberPeriods();

      if (planUpdateSkippedBecauseRevisionIsRequired) {
        showToast({
          message:
            "Aidat ayarları kaydedildi. Ancak seçili yılda ödeme geçmişi bulunduğu için plan tutarı doğrudan güncellenmedi. Tutar değişikliği için revizyon eklemelisin.",
          type: "info",
        });
        return;
      }

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
  }, [
    loadRecentPaymentsOnly,
    loadSettingsAndPlans,
    loadStatusesOnly,
    organizationId,
    planForm.amount,
    planForm.currency,
    planForm.isActive,
    plans,
    refreshExpandedMemberPeriods,
    settingsForm,
    showToast,
  ]);

  const handleAddRevision = useCallback(async () => {
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
  }, [
    loadSettingsAndPlans,
    loadStatusesOnly,
    organizationId,
    refreshExpandedMemberPeriods,
    revisionForm,
    selectedPlan,
    settingsForm.period,
    settingsForm.startYear,
    showToast,
  ]);

  const requestDeletePlan = useCallback((plan: OrganizationPaymentPlanDto) => {
    setPendingPlanDelete({
      year: plan.year,
      period: plan.period,
    });
    setPlanDeleteMode("delete");
    setPlanDeleteReasonCode(DEFAULT_PLAN_ROLLBACK_REASON);
    setPlanDeleteNote("");
  }, []);

  const confirmDeletePlan = useCallback(async () => {
    if (!pendingPlanDelete) return;

    const isRollbackMode = planDeleteMode === "rollback";

    if (isRollbackMode && !planDeleteNote.trim()) {
      showToast({
        message: "Toplu geri al ve sil işleminde açıklama zorunludur.",
        type: "error",
      });
      return;
    }

    if (isRollbackMode && planDeleteReasonCode === "Other" && !planDeleteNote.trim()) {
      showToast({
        message: "Diğer sebebi seçildiğinde açıklama zorunludur.",
        type: "error",
      });
      return;
    }

    try {
      setDeletingPlanYear(pendingPlanDelete.year);

      if (isRollbackMode) {
        await rollbackAndDeleteOrganizationPaymentPlan(
          organizationId,
          pendingPlanDelete.year,
          {
            reasonCode: planDeleteReasonCode,
            note: planDeleteNote.trim(),
          }
        );
      } else {
        await deleteOrganizationPaymentPlan(organizationId, pendingPlanDelete.year);
      }

      await Promise.all([loadSettingsAndPlans(), loadStatusesOnly(), loadRecentPaymentsOnly()]);
      await refreshExpandedMemberPeriods();

      showToast({
        message: isRollbackMode
          ? `${pendingPlanDelete.year} aidat planı toplu geri alınarak silindi.`
          : `${pendingPlanDelete.year} aidat planı silindi.`,
        type: "success",
      });

      setPendingPlanDelete(null);
      setPlanDeleteMode("delete");
      setPlanDeleteReasonCode(DEFAULT_PLAN_ROLLBACK_REASON);
      setPlanDeleteNote("");
    } catch (error) {
      showToast({
        message:
          error instanceof Error ? error.message : "Aidat planı silinemedi.",
        type: "error",
      });
    } finally {
      setDeletingPlanYear(null);
    }
  }, [
    loadRecentPaymentsOnly,
    loadSettingsAndPlans,
    loadStatusesOnly,
    organizationId,
    pendingPlanDelete,
    planDeleteMode,
    planDeleteNote,
    planDeleteReasonCode,
    refreshExpandedMemberPeriods,
    showToast,
  ]);

  const requestCancelPayment = useCallback((payment: RecentPaymentItem) => {
    if (payment.status === "Cancelled") return;

    setPendingPaymentCancel({
      paymentId: payment.paymentId,
      memberDisplayName: payment.memberDisplayName,
      periodLabel: payment.periodLabel,
      amount: payment.amount,
      currency: payment.currency,
    });

    setPaymentCancelReasonCode("");
    setPaymentCancelNote("");
  }, []);

  const requestCancelPaymentForPeriod = useCallback(
    (
      member: {
        memberId: string;
        displayName: string;
      },
      period: {
        id: string;
        periodLabel: string;
      },
      payment: RecentPaymentItem
    ) => {
      if (payment.status === "Cancelled") return;

      setPendingPaymentCancel({
        paymentId: payment.paymentId,
        memberId: member.memberId,
        periodId: period.id,
        memberDisplayName: member.displayName,
        periodLabel: period.periodLabel,
        amount: payment.amount,
        currency: payment.currency,
      });

      setPaymentCancelReasonCode("");
      setPaymentCancelNote("");
    },
    []
  );

  const confirmCancelPayment = useCallback(async () => {
    if (!pendingPaymentCancel) return;

    if (!paymentCancelReasonCode) {
      showToast({
        message: "Ödeme iptali için bir sebep seçmelisin.",
        type: "error",
      });
      return;
    }

    if (paymentCancelReasonCode === "Other" && !paymentCancelNote.trim()) {
      showToast({
        message: "Diğer sebebi seçildiğinde açıklama zorunludur.",
        type: "error",
      });
      return;
    }

    try {
      setCancellingPaymentId(
        pendingPaymentCancel.paymentId ?? pendingPaymentCancel.periodId ?? null
      );

      const payload = {
        reasonCode: paymentCancelReasonCode,
        note: paymentCancelNote.trim() || null,
      };

      if (pendingPaymentCancel.memberId && pendingPaymentCancel.periodId) {
        await cancelOrganizationMemberPeriodLastPayment(
          organizationId,
          pendingPaymentCancel.memberId,
          pendingPaymentCancel.periodId,
          payload
        );
      } else if (pendingPaymentCancel.paymentId) {
        await cancelOrganizationPayment(
          organizationId,
          pendingPaymentCancel.paymentId,
          payload
        );
      } else {
        throw new Error("İptal edilecek ödeme bilgisi bulunamadı.");
      }

      await Promise.all([loadStatusesOnly(), loadRecentPaymentsOnly()]);
      await refreshExpandedMemberPeriods();

      showToast({
        message: `${pendingPaymentCancel.memberDisplayName} için ${pendingPaymentCancel.periodLabel} ödeme kaydı iptal edildi.`,
        type: "success",
      });

      setPendingPaymentCancel(null);
      setPaymentCancelReasonCode("");
      setPaymentCancelNote("");
    } catch (error) {
      showToast({
        message: error instanceof Error ? error.message : "Ödeme kaydı iptal edilemedi.",
        type: "error",
      });
    } finally {
      setCancellingPaymentId(null);
    }
  }, [
    loadRecentPaymentsOnly,
    loadStatusesOnly,
    organizationId,
    paymentCancelNote,
    paymentCancelReasonCode,
    pendingPaymentCancel,
    refreshExpandedMemberPeriods,
    showToast,
  ]);

  const openPaymentConfirm = useCallback(
    (
      member: {
        memberId: string;
        displayName: string;
      },
      period: {
        id: string;
        periodLabel: string;
        currency: string;
      },
      amountText: string
    ) => {
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
    },
    [showToast]
  );

  const confirmPayment = useCallback(async () => {
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
  }, [
    loadMemberPeriods,
    loadRecentPaymentsOnly,
    loadStatusesOnly,
    organizationId,
    pendingPayment,
    periodYearFilterByMember,
    showOpenOnlyByMember,
    showToast,
  ]);

  const getCancelablePaymentForPeriod = useCallback(
    (member: { email: string }, period: { periodLabel: string }) => {
      const matches = recentPayments
        .filter(
          (x) =>
            x.memberEmail === member.email &&
            x.periodLabel === period.periodLabel &&
            x.status === "Completed"
        )
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

      return matches.length > 0 ? matches[0] : null;
    },
    [recentPayments]
  );

  const controlsDisabled = !settingsForm.isEnabled;

  return {
    search,
    setSearch,
    recentSearch,
    setRecentSearch,
    recentPaymentStatusFilter,
    setRecentPaymentStatusFilter,
    statusFilter,
    setStatusFilter,
    topDebtorsSearch,
    setTopDebtorsSearch,
    regularPayersSearch,
    setRegularPayersSearch,
    neverPaidSearch,
    setNeverPaidSearch,

    settings,
    settingsForm,
    setSettingsForm,
    planForm,
    setPlanForm,
    revisionForm,
    setRevisionForm,

    collectionType,
    activePeriodLabel: activePeriodInfo.label,
    activeCurrency,
    controlsDisabled,

    compatiblePlans,
    selectedPlanYear,
    selectedPlan,
    isSettingsPanelOpen,
    setIsSettingsPanelOpen,
    isRevisionPanelOpen,
    setIsRevisionPanelOpen,

    isLoading,
    pageError,
    isSavingAll,
    isAddingRevision,
    deletingPlanYear,
    cancellingPaymentId,
    payingPeriodId,

    members,
    filteredMembers,
    filteredRecentPayments,
    filteredTopDebtors,
    filteredRegularPayers,
    filteredNeverPaidMembers,

    expandedMemberIds,
    periodsByMember,
    periodYearFilterByMember,
    showOpenOnlyByMember,
    paymentAmountByPeriod,
    setPaymentAmountByPeriod,

    pendingPayment,
    setPendingPayment,
    pendingPlanDelete,
    setPendingPlanDelete,
    pendingPaymentCancel,
    setPendingPaymentCancel,

    planDeleteMode,
    setPlanDeleteMode,
    planDeleteReasonCode,
    setPlanDeleteReasonCode,
    planDeleteNote,
    setPlanDeleteNote,

    paymentCancelReasonCode,
    setPaymentCancelReasonCode,
    paymentCancelNote,
    setPaymentCancelNote,

    totalCollectedAmount,
    totalExpectedAmount,
    totalRemainingAmount,
    collectionRate,
    overdueCount,
    partialCount,
    paidCount,
    unpaidCount,
    neverPaidCount,

    getCollectionTypeLabel,
    getRevisionNotice,
    getCancelablePaymentForPeriod,

    toggleMember,
    handleRefreshMemberPeriods,
    handleYearFilterChange,
    handleShowOpenOnlyToggle,

    handleSaveAll,
    handleAddRevision,

    requestDeletePlan,
    confirmDeletePlan,
    requestCancelPayment,
    requestCancelPaymentForPeriod,
    confirmCancelPayment,

    openPaymentConfirm,
    confirmPayment,
  };
}