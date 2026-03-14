"use client";

import PaymentSectionCard from "./payment-section-card";
import PaymentCompactSummaryItem from "./payment-compact-summary-item";
import {
  formatCurrency,
  formatDate,
} from "../_payments-lib/payment-formatters";
import type {
  MemberPaymentStatus,
  MemberRow,
  PaymentPeriodRow,
  RecentPaymentItem,
  StatusFilter,
} from "../_payments-lib/payment-page-types";

function getStatusLabel(status: MemberPaymentStatus) {
  switch (status) {
    case "paid":
      return "Ödendi";
    case "partial":
      return "Kısmi";
    case "overdue":
      return "Gecikti";
    case "unpaid":
      return "Bekliyor";
    default:
      return "Plan yok";
  }
}

function getStatusBadgeStyle(status: MemberPaymentStatus) {
  switch (status) {
    case "paid":
      return {
        borderColor: "var(--success-border)",
        backgroundColor: "var(--success-bg)",
        color: "var(--success-text)",
      };
    case "partial":
      return {
        borderColor: "var(--warning-border)",
        backgroundColor: "var(--warning-bg)",
        color: "var(--warning-text)",
      };
    case "overdue":
      return {
        borderColor: "var(--danger-border)",
        backgroundColor: "var(--danger-bg)",
        color: "var(--danger-text)",
      };
    case "unpaid":
      return {
        borderColor: "var(--border)",
        backgroundColor: "var(--surface-soft-2)",
        color: "var(--text-muted)",
      };
    default:
      return {
        borderColor: "var(--border)",
        backgroundColor: "var(--surface-soft-2)",
        color: "var(--text-muted)",
      };
  }
}

function getPeriodStatusLabel(status: string, isOverdue: boolean) {
  if (isOverdue && status !== "Paid") return "Gecikti";
  if (status === "Paid") return "Ödendi";
  if (status === "Partial") return "Kısmi";
  return "Bekliyor";
}

function getPeriodStatusStyle(status: string, isOverdue: boolean) {
  if (isOverdue && status !== "Paid") {
    return {
      borderColor: "var(--danger-border)",
      backgroundColor: "var(--danger-bg)",
      color: "var(--danger-text)",
    };
  }

  if (status === "Paid") {
    return {
      borderColor: "var(--success-border)",
      backgroundColor: "var(--success-bg)",
      color: "var(--success-text)",
    };
  }

  if (status === "Partial") {
    return {
      borderColor: "var(--warning-border)",
      backgroundColor: "var(--warning-bg)",
      color: "var(--warning-text)",
    };
  }

  return {
    borderColor: "var(--border)",
    backgroundColor: "var(--surface-soft-2)",
    color: "var(--text-muted)",
  };
}

function memberHasNoPlan(member: MemberRow) {
  return (
    member.expectedAmount <= 0 &&
    member.paidAmount <= 0 &&
    member.totalOpenDebt <= 0 &&
    member.currentDuePeriodLabel === "Plan yok"
  );
}

type PaymentMembersSectionProps = {
  isLoading: boolean;
  filteredMembers: MemberRow[];
  search: string;
  statusFilter: StatusFilter;
  activeCurrency: string;
  expandedMemberIds: string[];
  periodsByMember: Record<string, PaymentPeriodRow[]>;
  periodYearFilterByMember: Record<string, string>;
  showOpenOnlyByMember: Record<string, boolean>;
  paymentAmountByPeriod: Record<string, string>;
  payingPeriodId: string | null;
  cancellingPaymentId: string | null;
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  onToggleMember: (memberId: string) => void;
  onYearFilterChange: (memberId: string, value: string) => void;
  onShowOpenOnlyToggle: (memberId: string, nextValue: boolean) => void;
  onRefreshMemberPeriods: (memberId: string) => void;
  onPaymentAmountChange: (periodId: string, value: string) => void;
  onOpenPaymentConfirm: (
    member: MemberRow,
    period: PaymentPeriodRow,
    amountText: string
  ) => void;
  onRequestCancelPaymentForPeriod: (
    member: MemberRow,
    period: PaymentPeriodRow,
    payment: RecentPaymentItem
  ) => void;
  getCancelablePaymentForPeriod: (
    member: MemberRow,
    period: PaymentPeriodRow
  ) => RecentPaymentItem | null;
  getRevisionNotice: (period: PaymentPeriodRow) => string | null;
};

export default function PaymentMembersSection({
  isLoading,
  filteredMembers,
  search,
  statusFilter,
  activeCurrency,
  expandedMemberIds,
  periodsByMember,
  periodYearFilterByMember,
  showOpenOnlyByMember,
  paymentAmountByPeriod,
  payingPeriodId,
  cancellingPaymentId,
  onSearchChange,
  onStatusFilterChange,
  onToggleMember,
  onYearFilterChange,
  onShowOpenOnlyToggle,
  onRefreshMemberPeriods,
  onPaymentAmountChange,
  onOpenPaymentConfirm,
  onRequestCancelPaymentForPeriod,
  getCancelablePaymentForPeriod,
  getRevisionNotice,
}: PaymentMembersSectionProps) {
  return (
    <PaymentSectionCard
      title="Üye Ödeme Durumları"
      description="Kartı açınca üyeye ait tüm borç dönemlerini görür, filtreler ve istediğin döneme ödeme işlersin."
      rightSlot={
        <div className="flex flex-col gap-2 md:flex-row">
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="İsim veya mail ile ara"
            className="w-full rounded-2xl border px-4 py-2.5 text-sm outline-none md:w-72"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-solid)",
              color: "var(--text)",
            }}
          />

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
            className="rounded-2xl border px-4 py-2.5 text-sm outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-solid)",
              color: "var(--text)",
            }}
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
        <div
          className="rounded-3xl border border-dashed p-10 text-center"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface-soft)",
            color: "var(--text-muted)",
          }}
        >
          Yükleniyor...
        </div>
      ) : filteredMembers.length === 0 ? (
        <div
          className="rounded-3xl border border-dashed p-10 text-center"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface-soft)",
            color: "var(--text-muted)",
          }}
        >
          Filtreye uygun üye bulunamadı.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMembers.map((member) => {
            const isExpanded = expandedMemberIds.includes(member.memberId);
            const memberPeriods = periodsByMember[member.memberId] ?? [];
            const hasNoPlan = memberHasNoPlan(member);

            return (
              <div
                key={member.memberId}
                className="overflow-hidden rounded-[24px] border shadow-sm"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-soft)",
                }}
              >
                <button
                  type="button"
                  onClick={() => onToggleMember(member.memberId)}
                  className="w-full p-4 text-left transition hover:brightness-[0.99]"
                >
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className="truncate text-base font-semibold"
                          style={{ color: "var(--text)" }}
                        >
                          {member.displayName}
                        </h3>

                        <span
                          className="rounded-full border px-2.5 py-1 text-xs font-medium"
                          style={getStatusBadgeStyle(member.status)}
                        >
                          {hasNoPlan ? "Plan yok" : getStatusLabel(member.status)}
                        </span>

                        {!member.isActive ? (
                          <span
                            className="rounded-full border px-2.5 py-1 text-xs font-medium"
                            style={{
                              borderColor: "var(--border)",
                              backgroundColor: "var(--surface-soft-2)",
                              color: "var(--text-muted)",
                            }}
                          >
                            Pasif Üye
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 truncate text-sm" style={{ color: "var(--text-muted)" }}>
                        {member.email}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span
                          className="rounded-full px-2.5 py-1 shadow-sm"
                          style={{ backgroundColor: "var(--surface-solid)" }}
                        >
                          Rol: {member.role}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-1 shadow-sm"
                          style={{ backgroundColor: "var(--surface-solid)" }}
                        >
                          Aktif borç dönemi: {hasNoPlan ? "Plan yok" : member.currentDuePeriodLabel ?? "—"}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-1 shadow-sm"
                          style={{ backgroundColor: "var(--surface-solid)" }}
                        >
                          Son ödeme: {formatDate(member.lastPaymentDate)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:min-w-[520px]">
                      <PaymentCompactSummaryItem
                        label="Beklenen"
                        value={formatCurrency(member.expectedAmount, activeCurrency)}
                      />
                      <PaymentCompactSummaryItem
                        label="Bu dönem ödenen"
                        value={formatCurrency(member.paidAmount, activeCurrency)}
                      />
                      <PaymentCompactSummaryItem
                        label="Toplam açık borç"
                        value={formatCurrency(member.totalOpenDebt, activeCurrency)}
                      />
                      <PaymentCompactSummaryItem
                        label="Durum"
                        value={hasNoPlan ? "Plan yok" : getStatusLabel(member.status)}
                      />
                    </div>
                  </div>
                </button>

                {isExpanded ? (
                  <div
                    className="border-t p-4"
                    style={{
                      borderColor: "var(--border)",
                      backgroundColor: "var(--surface-solid)",
                    }}
                  >
                    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <label>
                          <div className="mb-1 text-xs" style={{ color: "var(--text-muted)" }}>
                            Yıl filtresi
                          </div>
                          <input
                            type="number"
                            value={periodYearFilterByMember[member.memberId] ?? ""}
                            onChange={(e) =>
                              onYearFilterChange(member.memberId, e.target.value)
                            }
                            disabled={hasNoPlan}
                            className="w-full rounded-2xl border px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
                            placeholder="2026"
                            style={{
                              borderColor: "var(--border)",
                              backgroundColor: "var(--surface-solid)",
                              color: "var(--text)",
                            }}
                          />
                        </label>

                        <label className="flex items-center gap-2 pt-6">
                          <input
                            type="checkbox"
                            checked={showOpenOnlyByMember[member.memberId] ?? true}
                            onChange={(e) =>
                              onShowOpenOnlyToggle(member.memberId, e.target.checked)
                            }
                            disabled={hasNoPlan}
                          />
                          <span
                            className="text-sm"
                            style={{
                              color: hasNoPlan ? "var(--text-muted)" : "var(--text)",
                            }}
                          >
                            Sadece açık dönemler
                          </span>
                        </label>

                        <div className="pt-5">
                          <button
                            type="button"
                            onClick={() => onRefreshMemberPeriods(member.memberId)}
                            disabled={hasNoPlan}
                            className="rounded-2xl border px-4 py-2 text-sm font-medium transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                            style={{
                              borderColor: "var(--border)",
                              backgroundColor: "var(--surface-solid)",
                              color: "var(--text)",
                            }}
                          >
                            Dönemleri Yenile
                          </button>
                        </div>
                      </div>
                    </div>

                    {hasNoPlan ? (
                      <div
                        className="rounded-2xl border border-dashed p-6 text-center text-sm"
                        style={{
                          borderColor: "var(--border)",
                          backgroundColor: "var(--surface-soft)",
                          color: "var(--text-muted)",
                        }}
                      >
                        Bu üye için gösterilecek dönem bulunmuyor. Önce seçili yıl ve aidat tipi için plan oluşturmalısın.
                      </div>
                    ) : memberPeriods.length === 0 ? (
                      <div
                        className="rounded-2xl border border-dashed p-6 text-center text-sm"
                        style={{
                          borderColor: "var(--border)",
                          backgroundColor: "var(--surface-soft)",
                          color: "var(--text-muted)",
                        }}
                      >
                        Bu filtreye uygun dönem kaydı bulunamadı.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {memberPeriods.map((period) => {
                          const revisionNotice = getRevisionNotice(period);
                          const cancelablePayment = getCancelablePaymentForPeriod(
                            member,
                            period
                          );

                          return (
                            <div
                              key={period.id}
                              className="rounded-[22px] border p-4 shadow-sm"
                              style={{
                                borderColor: "var(--border)",
                                backgroundColor: "var(--surface-soft)",
                              }}
                            >
                              <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div
                                      className="text-base font-semibold"
                                      style={{ color: "var(--text)" }}
                                    >
                                      {period.periodLabel}
                                    </div>

                                    <span
                                      className="rounded-full border px-2.5 py-1 text-xs font-medium"
                                      style={getPeriodStatusStyle(period.status, period.isOverdue)}
                                    >
                                      {getPeriodStatusLabel(period.status, period.isOverdue)}
                                    </span>

                                    {period.isCurrentPeriod ? (
                                      <span
                                        className="rounded-full border px-2.5 py-1 text-xs font-medium"
                                        style={{
                                          borderColor: "var(--border-strong)",
                                          backgroundColor: "var(--surface-soft-2)",
                                          color: "var(--text)",
                                        }}
                                      >
                                        Aktif dönem
                                      </span>
                                    ) : null}

                                    {revisionNotice ? (
                                      <span
                                        className="rounded-full border px-2.5 py-1 text-xs font-medium"
                                        style={{
                                          borderColor: "var(--border)",
                                          backgroundColor: "var(--surface-solid)",
                                          color: "var(--text-muted)",
                                        }}
                                      >
                                        Revizyon farkı
                                      </span>
                                    ) : null}
                                  </div>

                                  <div className="mt-3 flex flex-wrap gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                                    <span
                                      className="rounded-full px-2.5 py-1 shadow-sm"
                                      style={{ backgroundColor: "var(--surface-solid)" }}
                                    >
                                      Beklenen: {formatCurrency(period.expectedAmount, period.currency)}
                                    </span>
                                    <span
                                      className="rounded-full px-2.5 py-1 shadow-sm"
                                      style={{ backgroundColor: "var(--surface-solid)" }}
                                    >
                                      Ödenen: {formatCurrency(period.paidAmount, period.currency)}
                                    </span>
                                    <span
                                      className="rounded-full px-2.5 py-1 shadow-sm"
                                      style={{ backgroundColor: "var(--surface-solid)" }}
                                    >
                                      Kalan: {formatCurrency(period.remainingAmount, period.currency)}
                                    </span>
                                    <span
                                      className="rounded-full px-2.5 py-1 shadow-sm"
                                      style={{ backgroundColor: "var(--surface-solid)" }}
                                    >
                                      Kayıt: {period.paymentCount}
                                    </span>
                                    <span
                                      className="rounded-full px-2.5 py-1 shadow-sm"
                                      style={{ backgroundColor: "var(--surface-solid)" }}
                                    >
                                      Son ödeme: {formatDate(period.lastPaidAtUtc)}
                                    </span>
                                  </div>

                                  {revisionNotice ? (
                                    <div
                                      className="mt-3 rounded-2xl border px-3 py-2 text-xs leading-5"
                                      style={{
                                        borderColor: "var(--border)",
                                        backgroundColor: "var(--surface-solid)",
                                        color: "var(--text-muted)",
                                      }}
                                    >
                                      {revisionNotice}
                                    </div>
                                  ) : null}
                                </div>

                                <div className="grid grid-cols-1 gap-2 md:grid-cols-[180px_auto]">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={paymentAmountByPeriod[period.id] ?? ""}
                                    onChange={(e) =>
                                      onPaymentAmountChange(period.id, e.target.value)
                                    }
                                    placeholder="Ödeme tutarı"
                                    disabled={period.remainingAmount <= 0}
                                    className="rounded-2xl border px-4 py-2.5 text-sm outline-none disabled:opacity-60"
                                    style={{
                                      borderColor: "var(--border)",
                                      backgroundColor: "var(--surface-solid)",
                                      color: "var(--text)",
                                    }}
                                  />

                                  <button
                                    type="button"
                                    onClick={() =>
                                      onOpenPaymentConfirm(
                                        member,
                                        period,
                                        paymentAmountByPeriod[period.id] ?? ""
                                      )
                                    }
                                    disabled={
                                      payingPeriodId === period.id ||
                                      period.remainingAmount <= 0
                                    }
                                    className="rounded-2xl px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60"
                                    style={{
                                      backgroundColor: "var(--primary)",
                                      color: "var(--primary-contrast)",
                                    }}
                                  >
                                    {payingPeriodId === period.id
                                      ? "İşleniyor..."
                                      : period.remainingAmount <= 0
                                      ? "Tamamlandı"
                                      : "Bu Döneme Ödeme Al"}
                                  </button>

                                  {cancelablePayment ? (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onRequestCancelPaymentForPeriod(
                                          member,
                                          period,
                                          cancelablePayment
                                        )
                                      }
                                      disabled={cancellingPaymentId === cancelablePayment.paymentId}
                                      className="rounded-2xl border px-4 py-2.5 text-sm font-medium transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
                                      style={{
                                        borderColor: "var(--border)",
                                        backgroundColor: "var(--surface-solid)",
                                        color: "var(--text)",
                                      }}
                                    >
                                      {cancellingPaymentId === cancelablePayment.paymentId
                                        ? "İşleniyor..."
                                        : "Son ödeme kaydını iptal et"}
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </PaymentSectionCard>
  );
}