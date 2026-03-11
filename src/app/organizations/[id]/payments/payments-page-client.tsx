"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
    getOrganizationMemberPaymentStatuses,
    getOrganizationPaymentSettings,
    getRecentOrganizationPayments,
    markOrganizationMemberPaymentPaid,
    type OrganizationMemberPaymentStatusDto,
    type OrganizationPaymentSettingsDto,
    type PaymentMethod,
    type RecentOrganizationMemberPaymentDto,
} from "@/lib/api";

type PaymentCollectionType = "monthly" | "yearly" | "disabled";
type MemberPaymentStatus = "paid" | "partial" | "unpaid" | "overdue";

type PaymentMemberRow = {
    memberId: string;
    displayName: string;
    email: string;
    role: string;
    isActive: boolean;
    status: MemberPaymentStatus;
    expectedAmount: number;
    paidAmount: number;
    remainingAmount: number;
    lastPaymentDate: string | null;
    lastPaymentPeriodLabel: string | null;
    paymentCount: number;
    overduePeriods: number;
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
    note?: string | null;
};

type PaymentTrendPoint = {
    label: string;
    expectedAmount: number;
    collectedAmount: number;
    remainingAmount: number;
    collectionRate: number;
};

type PaymentsDashboardData = {
    collectionType: PaymentCollectionType;
    currency: string;
    activePeriodLabel: string;
    totalMembers: number;
    payableMembers: number;
    paidMembers: number;
    overdueMembers: number;
    partialMembers: number;
    unpaidMembers: number;
    collectionRate: number;
    totalExpectedAmount: number;
    totalCollectedAmount: number;
    totalRemainingAmount: number;
    thisMonthCollectedAmount: number;
    thisYearCollectedAmount: number;
    members: PaymentMemberRow[];
    collectionTrend: PaymentTrendPoint[];
};

type StatusFilter = "all" | "paid" | "partial" | "unpaid" | "overdue";

function formatCurrency(amount: number, currency = "TRY") {
    return new Intl.NumberFormat("tr-TR", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(amount);
}

function formatDate(date: string | null) {
    if (!date) return "—";

    return new Intl.DateTimeFormat("tr-TR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    }).format(new Date(date));
}

function getStatusBadgeClass(status: MemberPaymentStatus) {
    switch (status) {
        case "paid":
            return "border border-emerald-200 bg-emerald-50 text-emerald-700";
        case "partial":
            return "border border-amber-200 bg-amber-50 text-amber-700";
        case "overdue":
            return "border border-rose-200 bg-rose-50 text-rose-700";
        case "unpaid":
        default:
            return "border border-slate-200 bg-slate-100 text-slate-700";
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
        case "unpaid":
        default:
            return "Bekliyor";
    }
}

function getCollectionTypeLabel(type: PaymentCollectionType) {
    switch (type) {
        case "monthly":
            return "Aylık";
        case "yearly":
            return "Yıllık";
        case "disabled":
        default:
            return "Kapalı";
    }
}

function getTrendTitle(collectionType: PaymentCollectionType) {
    switch (collectionType) {
        case "monthly":
            return "Aylık Tahsilat Trendi";
        case "yearly":
            return "Yıllık Tahsilat Trendi";
        default:
            return "Tahsilat Trendi";
    }
}

function getTrendDescription(collectionType: PaymentCollectionType) {
    switch (collectionType) {
        case "monthly":
            return "Beklenen tahsilat ile gerçekleşen tahsilatı ay bazlı karşılaştırın.";
        case "yearly":
            return "Beklenen tahsilat ile gerçekleşen tahsilatı yıl bazlı karşılaştırın.";
        default:
            return "Tahsilat verilerini dönem bazlı karşılaştırın.";
    }
}

function getMonthYearLabel(date: string | null) {
    if (!date) return null;

    return new Intl.DateTimeFormat("tr-TR", {
        month: "long",
        year: "numeric",
    }).format(new Date(date));
}

function getCollectionTypeFromSettings(
    settings: OrganizationPaymentSettingsDto | null
): PaymentCollectionType {
    if (!settings || !settings.isEnabled) return "disabled";

    if (settings.period === "Monthly") return "monthly";
    if (settings.period === "Yearly") return "yearly";

    return "disabled";
}

function inferMemberStatus(
    status: OrganizationMemberPaymentStatusDto,
    settings: OrganizationPaymentSettingsDto | null
): MemberPaymentStatus {
    if (!settings || !settings.isEnabled) return "unpaid";

    if (status.isOverdue) return "overdue";
    if (status.lastPaidAtUtc) return "paid";

    return "unpaid";
}

function buildTrendFromRecentPayments(
    recentPayments: RecentPaymentItem[],
    expectedAmountPerPeriod: number,
    collectionType: PaymentCollectionType
): PaymentTrendPoint[] {
    if (recentPayments.length === 0) {
        if (collectionType === "yearly") {
            return [
                {
                    label: new Date().getFullYear().toString(),
                    expectedAmount: expectedAmountPerPeriod,
                    collectedAmount: 0,
                    remainingAmount: expectedAmountPerPeriod,
                    collectionRate: 0,
                },
            ];
        }

        return [
            {
                label: new Intl.DateTimeFormat("tr-TR", {
                    month: "short",
                    year: "numeric",
                }).format(new Date()),
                expectedAmount: expectedAmountPerPeriod,
                collectedAmount: 0,
                remainingAmount: expectedAmountPerPeriod,
                collectionRate: 0,
            },
        ];
    }

    const grouped = new Map<string, number>();

    for (const payment of recentPayments) {
        const key = payment.periodLabel;
        grouped.set(key, (grouped.get(key) ?? 0) + payment.amount);
    }

    return Array.from(grouped.entries()).map(([label, collectedAmount]) => {
        const expectedAmount = expectedAmountPerPeriod;
        const remainingAmount = Math.max(expectedAmount - collectedAmount, 0);
        const collectionRate =
            expectedAmount > 0 ? (collectedAmount / expectedAmount) * 100 : 0;

        return {
            label,
            expectedAmount,
            collectedAmount,
            remainingAmount,
            collectionRate,
        };
    });
}

function mapRecentPaymentDtoToUi(
    item: RecentOrganizationMemberPaymentDto
): RecentPaymentItem {
    return {
        paymentId: item.paymentId,
        memberDisplayName: item.email,
        memberEmail: item.email,
        amount: item.amount,
        currency: item.currency,
        periodLabel: item.periodLabel,
        paidAt: item.paidAtUtc,
        markedByDisplayName: item.markedByEmail,
        methodLabel: item.paymentMethod,
        note: item.note,
    };
}

function mapStatusesToMembers(
    statuses: OrganizationMemberPaymentStatusDto[],
    settings: OrganizationPaymentSettingsDto | null
): PaymentMemberRow[] {
    const expectedAmount =
        settings?.isEnabled && typeof settings.amount === "number" ? settings.amount : 0;

    return statuses.map((status) => {
        const uiStatus = inferMemberStatus(status, settings);
        const paidAmount = uiStatus === "paid" ? expectedAmount : 0;
        const remainingAmount = Math.max(expectedAmount - paidAmount, 0);

        return {
            memberId: status.organizationMemberId,
            displayName: status.email,
            email: status.email,
            role: status.role,
            isActive: status.isMemberActive,
            status: uiStatus,
            expectedAmount,
            paidAmount,
            remainingAmount,
            lastPaymentDate: status.lastPaidAtUtc ?? null,
            lastPaymentPeriodLabel: getMonthYearLabel(status.lastPaidAtUtc),
            paymentCount: status.lastPaidAtUtc ? 1 : 0,
            overduePeriods: status.isOverdue ? 1 : 0,
        };
    });
}

function buildDashboardData(
    settings: OrganizationPaymentSettingsDto | null,
    statuses: OrganizationMemberPaymentStatusDto[],
    recentPayments: RecentPaymentItem[]
): PaymentsDashboardData {
    const collectionType = getCollectionTypeFromSettings(settings);
    const currency = settings?.currency ?? "TRY";
    const activePeriodLabel = settings?.startDateUtc
        ? new Intl.DateTimeFormat("tr-TR", {
            month: "long",
            year: "numeric",
        }).format(new Date(settings.startDateUtc))
        : "—";

    const members = mapStatusesToMembers(statuses, settings);

    const totalMembers = members.length;
    const payableMembers = members.length;
    const paidMembers = members.filter((x) => x.status === "paid").length;
    const partialMembers = members.filter((x) => x.status === "partial").length;
    const overdueMembers = members.filter((x) => x.status === "overdue").length;
    const unpaidMembers = members.filter((x) => x.status === "unpaid").length;

    const expectedAmountPerPeriod =
        settings?.isEnabled && typeof settings.amount === "number"
            ? settings.amount * Math.max(payableMembers, 1)
            : 0;

    const totalCollectedAmount = recentPayments.reduce(
        (sum, item) => sum + item.amount,
        0
    );

    const totalExpectedAmount = expectedAmountPerPeriod;
    const totalRemainingAmount = Math.max(
        totalExpectedAmount - totalCollectedAmount,
        0
    );

    const collectionRate =
        totalExpectedAmount > 0
            ? (totalCollectedAmount / totalExpectedAmount) * 100
            : 0;

    const now = new Date();
    const thisMonthCollectedAmount = recentPayments
        .filter((item) => {
            const date = new Date(item.paidAt);
            return (
                date.getUTCFullYear() === now.getUTCFullYear() &&
                date.getUTCMonth() === now.getUTCMonth()
            );
        })
        .reduce((sum, item) => sum + item.amount, 0);

    const thisYearCollectedAmount = recentPayments
        .filter((item) => {
            const date = new Date(item.paidAt);
            return date.getUTCFullYear() === now.getUTCFullYear();
        })
        .reduce((sum, item) => sum + item.amount, 0);

    const collectionTrend = buildTrendFromRecentPayments(
        recentPayments,
        expectedAmountPerPeriod,
        collectionType
    );

    return {
        collectionType,
        currency,
        activePeriodLabel,
        totalMembers,
        payableMembers,
        paidMembers,
        overdueMembers,
        partialMembers,
        unpaidMembers,
        collectionRate,
        totalExpectedAmount,
        totalCollectedAmount,
        totalRemainingAmount,
        thisMonthCollectedAmount,
        thisYearCollectedAmount,
        members,
        collectionTrend,
    };
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
                        Üyelerin ödeme durumlarını, geciken kayıtları, tahsilat oranını ve
                        son tahsilat hareketlerini tek ekranda yönetin. Bu yapı, ödeme
                        geçmişi, grafikler ve Excel çıktıları için hazır tasarlanmıştır.
                    </p>

                    <div className="mt-5 flex flex-wrap gap-2.5">
                        <button
                            type="button"
                            className="rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                        >
                            Ödendi Olarak İşaretle
                        </button>

                        <button
                            type="button"
                            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                        >
                            Tahsilat Geçmişi
                        </button>

                        <button
                            type="button"
                            className="rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/15"
                        >
                            Excel Çıktısı
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                            Aktif dönem
                        </div>
                        <div className="mt-1.5 text-[18px] font-semibold">
                            {activePeriodLabel}
                        </div>
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
                        <div className="mt-1.5 text-[18px] font-semibold">
                            %{collectionRate.toFixed(0)}
                        </div>
                        <div className="mt-1 text-xs text-slate-300">
                            Beklenen: {formatCurrency(totalExpectedAmount, currency)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({
    title,
    value,
    subtitle,
    accentClass,
}: {
    title: string;
    value: string;
    subtitle?: string;
    accentClass?: string;
}) {
    return (
        <div className="rounded-[24px] border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div
                className={`mb-4 h-1.5 w-14 rounded-full ${accentClass ?? "bg-slate-900"
                    }`}
            />
            <div className="text-sm font-medium text-slate-500">{title}</div>
            <div className="mt-2 text-[20px] font-semibold tracking-tight text-slate-900">
                {value}
            </div>
            {subtitle ? (
                <div className="mt-2 text-xs leading-5 text-slate-500">{subtitle}</div>
            ) : null}
        </div>
    );
}

function SectionCard({
    title,
    description,
    children,
    rightSlot,
}: {
    title: string;
    description?: string;
    children: React.ReactNode;
    rightSlot?: React.ReactNode;
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

            <div className="p-5">{children}</div>
        </div>
    );
}

function ProgressPill({
    label,
    value,
    tone,
}: {
    label: string;
    value: string;
    tone: "slate" | "emerald" | "amber" | "rose";
}) {
    const toneClass =
        tone === "emerald"
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : tone === "amber"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : tone === "rose"
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : "bg-slate-100 text-slate-700 border-slate-200";

    return (
        <div className={`rounded-2xl border px-3 py-2 text-sm ${toneClass}`}>
            <div className="text-xs opacity-80">{label}</div>
            <div className="mt-1 font-semibold">{value}</div>
        </div>
    );
}

function TrendBars({
    points,
    currency,
}: {
    points: PaymentTrendPoint[];
    currency: string;
}) {
    const maxValue = Math.max(...points.map((x) => x.expectedAmount), 1);

    return (
        <div className="space-y-5">
            {points.map((point) => {
                const expectedWidth = (point.expectedAmount / maxValue) * 100;
                const collectedWidth = (point.collectedAmount / maxValue) * 100;

                return (
                    <div key={point.label}>
                        <div className="mb-2 flex items-center justify-between gap-4 text-xs text-slate-500">
                            <div className="font-medium text-slate-700">{point.label}</div>
                            <div className="text-right">
                                {formatCurrency(point.collectedAmount, currency)} /{" "}
                                {formatCurrency(point.expectedAmount, currency)}
                            </div>
                        </div>

                        <div className="h-3.5 rounded-full bg-slate-200">
                            <div
                                className="relative h-3.5 rounded-full bg-slate-300"
                                style={{ width: `${expectedWidth}%` }}
                            >
                                <div
                                    className="absolute left-0 top-0 h-3.5 rounded-full bg-slate-800"
                                    style={{
                                        width:
                                            expectedWidth === 0
                                                ? "0%"
                                                : `${(collectedWidth / expectedWidth) * 100}%`,
                                    }}
                                />
                            </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                                Tahsilat oranı: %{point.collectionRate.toFixed(0)}
                            </span>
                            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                                Kalan: {formatCurrency(point.remainingAmount, currency)}
                            </span>
                        </div>
                    </div>
                );
            })}
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

export default function OrganizationPaymentsPageClient({
    organizationId,
}: {
    organizationId: string;
}) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

    const [settings, setSettings] = useState<OrganizationPaymentSettingsDto | null>(
        null
    );
    const [members, setMembers] = useState<OrganizationMemberPaymentStatusDto[]>([]);
    const [recentPayments, setRecentPayments] = useState<RecentPaymentItem[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState<string | null>(null);
    const [markingMemberId, setMarkingMemberId] = useState<string | null>(null);
    const [expandedMemberIds, setExpandedMemberIds] = useState<string[]>([]);

    const loadPageData = useCallback(async () => {
        try {
            setIsLoading(true);
            setPageError(null);

            const [settingsResult, membersResult, recentResult] = await Promise.all([
                getOrganizationPaymentSettings(organizationId),
                getOrganizationMemberPaymentStatuses(organizationId),
                getRecentOrganizationPayments(organizationId, 8),
            ]);

            setSettings(settingsResult);
            setMembers(membersResult);
            setRecentPayments(recentResult.map(mapRecentPaymentDtoToUi));
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Ödeme ekranı yüklenirken bir hata oluştu.";

            setPageError(message);
        } finally {
            setIsLoading(false);
        }
    }, [organizationId]);

    useEffect(() => {
        loadPageData();
    }, [loadPageData]);

    const data = useMemo(
        () => buildDashboardData(settings, members, recentPayments),
        [settings, members, recentPayments]
    );

    const filteredMembers = useMemo(() => {
        return data.members.filter((member) => {
            const searchValue = search.trim().toLowerCase();

            const matchesSearch =
                searchValue.length === 0
                    ? true
                    : member.displayName.toLowerCase().includes(searchValue) ||
                    member.email.toLowerCase().includes(searchValue);

            const matchesStatus =
                statusFilter === "all" ? true : member.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [data.members, search, statusFilter]);

    const topDebtors = useMemo(() => {
        return [...data.members]
            .sort((a, b) => b.remainingAmount - a.remainingAmount)
            .slice(0, 5);
    }, [data.members]);

    const mostRegularPayers = useMemo(() => {
        return [...data.members]
            .sort((a, b) => {
                if (b.paymentCount !== a.paymentCount) {
                    return b.paymentCount - a.paymentCount;
                }

                return a.overduePeriods - b.overduePeriods;
            })
            .slice(0, 5);
    }, [data.members]);

    const averageCollectionRate =
        data.collectionTrend.length > 0
            ? data.collectionTrend.reduce((sum, item) => sum + item.collectionRate, 0) /
            data.collectionTrend.length
            : 0;

    const maxCollectedAmount =
        data.collectionTrend.length > 0
            ? Math.max(...data.collectionTrend.map((item) => item.collectedAmount))
            : 0;

    const totalTrendRemaining = data.collectionTrend.reduce(
        (sum, item) => sum + item.remainingAmount,
        0
    );

    function toggleMemberExpand(memberId: string) {
        setExpandedMemberIds((prev) =>
            prev.includes(memberId)
                ? prev.filter((x) => x !== memberId)
                : [...prev, memberId]
        );
    }

    async function handleMarkPaid(memberId: string) {
        try {
            setMarkingMemberId(memberId);

            const nowUtc = new Date().toISOString();
            const defaultPaymentMethod: PaymentMethod = "Cash";

            await markOrganizationMemberPaymentPaid(organizationId, memberId, {
                paidAtUtc: nowUtc,
                paymentMethod: defaultPaymentMethod,
                note: null,
            });

            await loadPageData();
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : "Ödeme işaretlenirken bir hata oluştu.";

            alert(message);
        } finally {
            setMarkingMemberId(null);
        }
    }

    return (
        <div className="space-y-6 rounded-[32px] bg-[#e5e7eb] p-3">
            <DashboardHeroCard
                collectionType={data.collectionType}
                activePeriodLabel={data.activePeriodLabel}
                totalCollectedAmount={data.totalCollectedAmount}
                totalExpectedAmount={data.totalExpectedAmount}
                collectionRate={data.collectionRate}
                currency={data.currency}
            />

            {pageError ? (
                <div className="rounded-[28px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                    {pageError}
                </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-6">
                <StatCard
                    title="Aidat Sistemi"
                    value={getCollectionTypeLabel(data.collectionType)}
                    subtitle={`Aktif dönem: ${data.activePeriodLabel}`}
                    accentClass="bg-slate-900"
                />

                <StatCard
                    title="Ödeme Beklenen Üye"
                    value={String(data.payableMembers)}
                    subtitle={`Toplam üye: ${data.totalMembers}`}
                    accentClass="bg-sky-500"
                />

                <StatCard
                    title="Ödeyen Üye"
                    value={String(data.paidMembers)}
                    subtitle={`Tahsilat oranı: %${data.collectionRate.toFixed(0)}`}
                    accentClass="bg-emerald-500"
                />

                <StatCard
                    title="Geciken Üye"
                    value={String(data.overdueMembers)}
                    subtitle={`Kısmi ödeme: ${data.partialMembers}`}
                    accentClass="bg-rose-500"
                />

                <StatCard
                    title="Toplam Tahsil Edilen"
                    value={formatCurrency(data.totalCollectedAmount, data.currency)}
                    subtitle={`Bu ay: ${formatCurrency(
                        data.thisMonthCollectedAmount,
                        data.currency
                    )}`}
                    accentClass="bg-indigo-500"
                />

                <StatCard
                    title="Kalan Alacak"
                    value={formatCurrency(data.totalRemainingAmount, data.currency)}
                    subtitle={`Beklenen toplam: ${formatCurrency(
                        data.totalExpectedAmount,
                        data.currency
                    )}`}
                    accentClass="bg-amber-500"
                />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                    <SectionCard
                        title="Üye Ödeme Durumları"
                        description="Kompakt görünüm ile üyeleri yönetin. Detaylar açılır yapıdadır."
                        rightSlot={
                            <div className="flex flex-col gap-2 md:flex-row">
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="İsim veya mail ile ara"
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400 md:w-72"
                                />

                                <select
                                    value={statusFilter}
                                    onChange={(e) =>
                                        setStatusFilter(e.target.value as StatusFilter)
                                    }
                                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-slate-400"
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
                        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
                            <ProgressPill
                                label="Ödendi"
                                value={String(data.paidMembers)}
                                tone="emerald"
                            />
                            <ProgressPill
                                label="Kısmi ödeme"
                                value={String(data.partialMembers)}
                                tone="amber"
                            />
                            <ProgressPill
                                label="Geciken"
                                value={String(data.overdueMembers)}
                                tone="rose"
                            />
                            <ProgressPill
                                label="Bekleyen"
                                value={String(data.unpaidMembers)}
                                tone="slate"
                            />
                        </div>

                        {isLoading ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                                <div className="text-base font-medium text-slate-700">
                                    Üye ödeme durumları yükleniyor...
                                </div>
                            </div>
                        ) : filteredMembers.length === 0 ? (
                            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                                <div className="text-base font-medium text-slate-700">
                                    Filtreye uygun üye bulunamadı
                                </div>
                                <p className="mt-2 text-sm text-slate-500">
                                    Arama veya durum filtresini değiştirerek tekrar deneyin.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredMembers.map((member) => {
                                    const isExpanded = expandedMemberIds.includes(member.memberId);

                                    return (
                                        <div
                                            key={member.memberId}
                                            className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50 shadow-sm"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => toggleMemberExpand(member.memberId)}
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
                                                                Son dönem: {member.lastPaymentPeriodLabel ?? "—"}
                                                            </span>
                                                            <span className="rounded-full bg-white px-2.5 py-1 shadow-sm">
                                                                Ödeme sayısı: {member.paymentCount}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[520px]">
                                                        <CompactSummaryItem
                                                            label="Beklenen"
                                                            value={formatCurrency(
                                                                member.expectedAmount,
                                                                data.currency
                                                            )}
                                                        />
                                                        <CompactSummaryItem
                                                            label="Ödenen"
                                                            value={formatCurrency(member.paidAmount, data.currency)}
                                                        />
                                                        <CompactSummaryItem
                                                            label="Kalan"
                                                            value={formatCurrency(
                                                                member.remainingAmount,
                                                                data.currency
                                                            )}
                                                        />
                                                        <CompactSummaryItem
                                                            label="Son ödeme"
                                                            value={formatDate(member.lastPaymentDate)}
                                                        />
                                                    </div>
                                                </div>
                                            </button>

                                            {isExpanded ? (
                                                <div className="border-t border-slate-200 bg-white p-4">
                                                    <div className="mb-4 flex flex-wrap gap-2 text-xs text-slate-500">
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                                            Geciken dönem: {member.overduePeriods}
                                                        </span>
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-1">
                                                            Durum: {getStatusLabel(member.status)}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            className="rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                                                        >
                                                            Detay
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleMarkPaid(member.memberId)}
                                                            disabled={markingMemberId === member.memberId || member.status === "paid"}
                                                            className="rounded-2xl bg-slate-900 px-3.5 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            {markingMemberId === member.memberId
                                                                ? "İşleniyor..."
                                                                : member.status === "paid"
                                                                    ? "Bu Dönem Ödendi"
                                                                    : "Ödendi Olarak İşaretle"}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </SectionCard>

                    <SectionCard
                        title={getTrendTitle(data.collectionType)}
                        description={getTrendDescription(data.collectionType)}
                        rightSlot={
                            <div className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                Görünüm: {getCollectionTypeLabel(data.collectionType)}
                            </div>
                        }
                    >
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-[26px] border border-slate-200 bg-slate-50 p-4">
                                <TrendBars points={data.collectionTrend} currency={data.currency} />
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-1">
                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-sm font-medium text-slate-500">
                                        Ortalama tahsilat oranı
                                    </div>
                                    <div className="mt-2 text-2xl font-semibold text-slate-900">
                                        %{averageCollectionRate.toFixed(0)}
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-sm font-medium text-slate-500">
                                        En yüksek tahsilat
                                    </div>
                                    <div className="mt-2 text-2xl font-semibold text-slate-900">
                                        {formatCurrency(maxCollectedAmount, data.currency)}
                                    </div>
                                </div>

                                <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                                    <div className="text-sm font-medium text-slate-500">
                                        Trend toplam kalan
                                    </div>
                                    <div className="mt-2 text-2xl font-semibold text-slate-900">
                                        {formatCurrency(totalTrendRemaining, data.currency)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Rapor ve Dışa Aktarma"
                        description="Excel ve diğer çıktı formatları için hazır alanlar."
                    >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                <div className="text-sm font-semibold text-slate-900">
                                    Üye Borç Durumu
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Beklenen, ödenen ve kalan bakiyeleri üye bazında dışa aktar.
                                </p>
                                <button
                                    type="button"
                                    className="mt-5 rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                    Excel Al
                                </button>
                            </div>

                            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                <div className="text-sm font-semibold text-slate-900">
                                    Tahsilat Geçmişi
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Tüm ödeme hareketlerini tarih, dönem ve tutar bilgisiyle dışa
                                    aktar.
                                </p>
                                <button
                                    type="button"
                                    className="mt-5 rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                    Excel Al
                                </button>
                            </div>

                            <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                                <div className="text-sm font-semibold text-slate-900">
                                    Dönem Özeti
                                </div>
                                <p className="mt-2 text-sm leading-6 text-slate-500">
                                    Dönem bazında beklenen, gerçekleşen ve kalan alacak özetini dışa
                                    aktar.
                                </p>
                                <button
                                    type="button"
                                    className="mt-5 rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                                >
                                    Excel Al
                                </button>
                            </div>
                        </div>
                    </SectionCard>
                </div>

                <div className="space-y-6">
                    <SectionCard
                        title="Son Tahsilatlar"
                        description="Kompakt görünüm. Liste büyürse bölüm içinde scroll olur."
                    >
                        <div className="max-h-[520px] overflow-y-auto pr-1">
                            {isLoading ? (
                                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                                    <div className="text-sm font-medium text-slate-700">
                                        Son tahsilatlar yükleniyor...
                                    </div>
                                </div>
                            ) : recentPayments.length === 0 ? (
                                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                                    <div className="text-sm font-medium text-slate-700">
                                        Henüz tahsilat kaydı yok
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">
                                        İlk ödeme kaydı oluştuğunda burada son tahsilatları
                                        göreceksiniz.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recentPayments.map((payment) => (
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
                                                {payment.note ? <div>Not: {payment.note}</div> : null}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="En Yüksek Kalan Borç"
                        description="Tahsilat önceliği için hızlı görünüm."
                    >
                        <div className="max-h-[320px] overflow-y-auto pr-1">
                            <div className="space-y-3">
                                {topDebtors.map((member, index) => (
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
                                            {formatCurrency(member.remainingAmount, data.currency)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Düzenli Ödeyenler"
                        description="Kompakt liste. Büyürse bölüm içinde akar."
                    >
                        <div className="max-h-[320px] overflow-y-auto pr-1">
                            <div className="space-y-3">
                                {mostRegularPayers.map((member, index) => (
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
                                                Ödeme sayısı: {member.paymentCount}
                                            </div>
                                        </div>

                                        <div className="text-right text-xs text-slate-500">
                                            Geciken dönem: {member.overduePeriods}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </SectionCard>

                    <SectionCard
                        title="Aidat Ayar Özeti"
                        description="Mevcut ayarların hızlı özeti."
                    >
                        <div className="space-y-3 text-sm text-slate-600">
                            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                                <span>Aidat tipi</span>
                                <span className="font-medium text-slate-900">
                                    {getCollectionTypeLabel(data.collectionType)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                                <span>Aktif dönem</span>
                                <span className="font-medium text-slate-900">
                                    {data.activePeriodLabel}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                                <span>Beklenen toplam</span>
                                <span className="font-medium text-slate-900">
                                    {formatCurrency(data.totalExpectedAmount, data.currency)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                                <span>Tahsil edilen</span>
                                <span className="font-medium text-slate-900">
                                    {formatCurrency(data.totalCollectedAmount, data.currency)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                                <span>Kalan alacak</span>
                                <span className="font-medium text-slate-900">
                                    {formatCurrency(data.totalRemainingAmount, data.currency)}
                                </span>
                            </div>

                            <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2.5">
                                <span>Bu yıl tahsil edilen</span>
                                <span className="font-medium text-slate-900">
                                    {formatCurrency(data.thisYearCollectedAmount, data.currency)}
                                </span>
                            </div>
                        </div>
                    </SectionCard>
                </div>
            </div>

            <div className="hidden">{organizationId}</div>
        </div>
    );
}