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
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none md:w-72"
          />

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as StatusFilter)}
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
                  onClick={() => onToggleMember(member.memberId)}
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
                              onYearFilterChange(member.memberId, e.target.value)
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
                              onShowOpenOnlyToggle(member.memberId, e.target.checked)
                            }
                          />
                          <span className="text-sm text-slate-700">
                            Sadece açık dönemler
                          </span>
                        </label>

                        <div className="pt-5">
                          <button
                            type="button"
                            onClick={() => onRefreshMemberPeriods(member.memberId)}
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
                        {memberPeriods.map((period) => {
                          const revisionNotice = getRevisionNotice(period);
                          const cancelablePayment = getCancelablePaymentForPeriod(
                            member,
                            period
                          );

                          return (
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

                                    {revisionNotice ? (
                                      <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700">
                                        Revizyon farkı
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

                                  {revisionNotice ? (
                                    <div className="mt-3 rounded-2xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs leading-5 text-violet-800">
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
                                    className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none disabled:opacity-60"
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
                                    className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
                                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 md:col-span-2"
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