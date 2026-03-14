"use client";

import PaymentSectionCard from "./payment-section-card";
import {
  formatCurrency,
  formatDate,
  getPaymentCancellationReasonLabel,
  getPaymentCancellationTypeLabel,
} from "../_payments-lib/payment-formatters";
import type {
  MemberPaymentStatus,
  MemberRow,
  RecentPaymentItem,
  RecentPaymentStatusFilter,
} from "../_payments-lib/payment-page-types";

function getStatusLabel(status: MemberPaymentStatus) {
  switch (status) {
    case "paid":
      return "Ödendi";
    case "partial":
      return "Kısmi";
    case "overdue":
      return "Gecikti";
    case "no-plan":
      return "Plan yok";
    default:
      return "Bekliyor";
  }
}

export default function PaymentSidePanels({
  filteredRecentPayments,
  filteredTopDebtors,
  filteredRegularPayers,
  filteredNeverPaidMembers,
  recentSearch,
  recentPaymentStatusFilter,
  topDebtorsSearch,
  regularPayersSearch,
  neverPaidSearch,
  activeCurrency,
  cancellingPaymentId,
  onRecentSearchChange,
  onRecentPaymentStatusFilterChange,
  onTopDebtorsSearchChange,
  onRegularPayersSearchChange,
  onNeverPaidSearchChange,
  onRequestCancelPayment,
}: {
  filteredRecentPayments: RecentPaymentItem[];
  filteredTopDebtors: MemberRow[];
  filteredRegularPayers: MemberRow[];
  filteredNeverPaidMembers: MemberRow[];
  recentSearch: string;
  recentPaymentStatusFilter: RecentPaymentStatusFilter;
  topDebtorsSearch: string;
  regularPayersSearch: string;
  neverPaidSearch: string;
  activeCurrency: string;
  cancellingPaymentId: string | null;
  onRecentSearchChange: (value: string) => void;
  onRecentPaymentStatusFilterChange: (value: RecentPaymentStatusFilter) => void;
  onTopDebtorsSearchChange: (value: string) => void;
  onRegularPayersSearchChange: (value: string) => void;
  onNeverPaidSearchChange: (value: string) => void;
  onRequestCancelPayment: (payment: RecentPaymentItem) => void;
}) {
  return (
    <div className="space-y-6">
      <PaymentSectionCard
        title="Son Tahsilatlar"
        description="Liste büyürse bölüm içinde scroll olur."
        rightSlot={
          <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row">
            <input
              value={recentSearch}
              onChange={(e) => onRecentSearchChange(e.target.value)}
              placeholder="İsim veya mail ile ara"
              className="w-full rounded-2xl border px-4 py-2.5 text-sm outline-none md:w-56"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-solid)",
                color: "var(--text)",
              }}
            />

            <select
              value={recentPaymentStatusFilter}
              onChange={(e) =>
                onRecentPaymentStatusFilterChange(
                  e.target.value as RecentPaymentStatusFilter
                )
              }
              className="rounded-2xl border px-4 py-2.5 text-sm outline-none"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-solid)",
                color: "var(--text)",
              }}
            >
              <option value="all">Tümü</option>
              <option value="completed">Tamamlanan</option>
              <option value="cancelled">İptal edilen</option>
            </select>
          </div>
        }
      >
        <div className="max-h-[420px] overflow-y-auto pr-1">
          {filteredRecentPayments.length === 0 ? (
            <div
              className="rounded-3xl border border-dashed p-8 text-center"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-soft)",
              }}
            >
              <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                Filtreye uygun tahsilat kaydı yok
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecentPayments.map((payment) => (
                <div
                  key={payment.paymentId}
                  className="rounded-[22px] border p-3 shadow-sm"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-soft)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className="truncate text-sm font-semibold"
                        style={{ color: "var(--text)" }}
                      >
                        {payment.memberDisplayName}
                      </div>
                      <div className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                        {payment.memberEmail}
                      </div>
                    </div>

                    <div
                      className="rounded-2xl px-3 py-1.5 text-sm font-semibold shadow-sm"
                      style={{
                        backgroundColor: "var(--surface-solid)",
                        color: "var(--text)",
                      }}
                    >
                      {formatCurrency(payment.amount, payment.currency)}
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span
                      className="rounded-full px-2.5 py-1 shadow-sm"
                      style={{ backgroundColor: "var(--surface-solid)" }}
                    >
                      {payment.periodLabel}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 shadow-sm"
                      style={{ backgroundColor: "var(--surface-solid)" }}
                    >
                      {payment.methodLabel}
                    </span>
                    <span
                      className="rounded-full px-2.5 py-1 shadow-sm"
                      style={
                        payment.status === "Cancelled"
                          ? {
                              border: "1px solid var(--danger-border)",
                              backgroundColor: "var(--danger-bg)",
                              color: "var(--danger-text)",
                            }
                          : {
                              backgroundColor: "var(--surface-solid)",
                              color: "var(--text)",
                            }
                      }
                    >
                      {payment.status === "Cancelled" ? "İptal edildi" : "Tamamlandı"}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    <div>Ödeme tarihi: {formatDate(payment.paidAt)}</div>
                    <div>İşaretleyen: {payment.markedByDisplayName}</div>

                    {payment.status === "Cancelled" ? (
                      <>
                        <div>İptal tarihi: {formatDate(payment.cancelledAtUtc ?? null)}</div>
                        <div>İptal eden: {payment.cancelledByDisplayName ?? "—"}</div>
                        <div>
                          İptal tipi:{" "}
                          {getPaymentCancellationTypeLabel(payment.cancellationType)}
                        </div>
                        <div>
                          İptal sebebi:{" "}
                          {getPaymentCancellationReasonLabel(
                            payment.cancellationReasonCode
                          )}
                        </div>
                        {payment.cancellationNote ? (
                          <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] leading-5 text-slate-600">
                            {payment.cancellationNote}
                          </div>
                        ) : null}
                      </>
                    ) : null}
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onRequestCancelPayment(payment)}
                      disabled={
                        payment.status === "Cancelled" ||
                        cancellingPaymentId === payment.paymentId
                      }
                      className="rounded-2xl border px-3 py-2 text-xs font-medium transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        borderColor: "var(--border)",
                        backgroundColor: "var(--surface-solid)",
                        color: "var(--text)",
                      }}
                    >
                      {cancellingPaymentId === payment.paymentId
                        ? "İşleniyor..."
                        : payment.status === "Cancelled"
                        ? "İptal edildi"
                        : "Ödemeyi iptal et"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PaymentSectionCard>

      <PaymentSectionCard
        title="En Yüksek Kalan Borç"
        description="Üye bazlı toplam açık borç listesi."
        rightSlot={
          <input
            value={topDebtorsSearch}
            onChange={(e) => onTopDebtorsSearchChange(e.target.value)}
            placeholder="İsim veya mail ile ara"
            className="w-full rounded-2xl border px-4 py-2.5 text-sm outline-none md:w-72"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-solid)",
              color: "var(--text)",
            }}
          />
        }
      >
        <div className="max-h-[320px] overflow-y-auto pr-1">
          <div className="space-y-3">
            {filteredTopDebtors.length === 0 ? (
              <div
                className="rounded-2xl border border-dashed p-6 text-center text-sm"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-soft)",
                  color: "var(--text-muted)",
                }}
              >
                Filtreye uygun kayıt yok.
              </div>
            ) : (
              filteredTopDebtors.map((member, index) => (
                <div
                  key={member.memberId}
                  className="flex items-center justify-between gap-3 rounded-[22px] border p-3"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-soft)",
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: "var(--primary)",
                          color: "var(--primary-contrast)",
                        }}
                      >
                        {index + 1}
                      </span>
                      <div className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>
                        {member.displayName}
                      </div>
                    </div>
                    <div className="mt-1 truncate text-xs" style={{ color: "var(--text-muted)" }}>
                      {member.email}
                    </div>
                  </div>

                  <div className="text-right text-sm font-semibold" style={{ color: "var(--text)" }}>
                    {formatCurrency(member.totalOpenDebt, activeCurrency)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PaymentSectionCard>

      <PaymentSectionCard
        title="Düzenli Ödeyenler"
        description="Düzenli ödeme davranışında olan üyeler. Sağdaki değer bu dönemde ödedikleri tutarı gösterir."
        rightSlot={
          <input
            value={regularPayersSearch}
            onChange={(e) => onRegularPayersSearchChange(e.target.value)}
            placeholder="İsim veya mail ile ara"
            className="w-full rounded-2xl border px-4 py-2.5 text-sm outline-none md:w-72"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-solid)",
              color: "var(--text)",
            }}
          />
        }
      >
        <div className="max-h-[280px] overflow-y-auto pr-1">
          <div className="space-y-3">
            {filteredRegularPayers.length === 0 ? (
              <div
                className="rounded-2xl border border-dashed p-6 text-center text-sm"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-soft)",
                  color: "var(--text-muted)",
                }}
              >
                Filtreye uygun kayıt yok.
              </div>
            ) : (
              filteredRegularPayers.map((member, index) => (
                <div
                  key={member.memberId}
                  className="flex items-center justify-between gap-3 rounded-[22px] border p-3"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-soft)",
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: "var(--success-text)",
                          color: "var(--primary-contrast)",
                        }}
                      >
                        {index + 1}
                      </span>
                      <div className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>
                        {member.displayName}
                      </div>
                    </div>
                    <div className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      Son ödeme: {formatDate(member.lastPaymentDate)}
                    </div>
                  </div>

                  <div className="text-right text-xs" style={{ color: "var(--text-muted)" }}>
                    Bu dönem ödenen: {formatCurrency(member.paidAmount, activeCurrency)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PaymentSectionCard>

      <PaymentSectionCard
        title="Hiç Ödeme Yapmayanlar"
        description="İlk tahsilatı bekleyen üyeler."
        rightSlot={
          <input
            value={neverPaidSearch}
            onChange={(e) => onNeverPaidSearchChange(e.target.value)}
            placeholder="İsim veya mail ile ara"
            className="w-full rounded-2xl border px-4 py-2.5 text-sm outline-none md:w-72"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-solid)",
              color: "var(--text)",
            }}
          />
        }
      >
        <div className="max-h-[280px] overflow-y-auto pr-1">
          <div className="space-y-3">
            {filteredNeverPaidMembers.length === 0 ? (
              <div
                className="rounded-2xl border border-dashed p-6 text-center text-sm"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-soft)",
                  color: "var(--text-muted)",
                }}
              >
                Filtreye uygun kayıt yok.
              </div>
            ) : (
              filteredNeverPaidMembers.map((member, index) => (
                <div
                  key={member.memberId}
                  className="flex items-center justify-between gap-3 rounded-[22px] border p-3"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-soft)",
                  }}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
                        style={{
                          backgroundColor: "var(--danger-text)",
                          color: "var(--primary-contrast)",
                        }}
                      >
                        {index + 1}
                      </span>
                      <div className="truncate text-sm font-medium" style={{ color: "var(--text)" }}>
                        {member.displayName}
                      </div>
                    </div>
                    <div className="mt-1 truncate text-xs" style={{ color: "var(--text-muted)" }}>
                      {member.email}
                    </div>
                  </div>

                  <div className="text-right text-xs" style={{ color: "var(--text-muted)" }}>
                    Durum: {getStatusLabel(member.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PaymentSectionCard>
    </div>
  );
}