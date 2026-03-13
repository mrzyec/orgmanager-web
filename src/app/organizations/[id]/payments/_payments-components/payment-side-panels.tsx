"use client";

import PaymentSectionCard from "./payment-section-card";
import {
  formatCurrency,
  formatDate,
} from "../_payments-lib/payment-formatters";
import type {
  MemberPaymentStatus,
  MemberRow,
  RecentPaymentItem,
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

type PaymentSidePanelsProps = {
  filteredRecentPayments: RecentPaymentItem[];
  filteredTopDebtors: MemberRow[];
  filteredRegularPayers: MemberRow[];
  filteredNeverPaidMembers: MemberRow[];
  recentSearch: string;
  topDebtorsSearch: string;
  regularPayersSearch: string;
  neverPaidSearch: string;
  activeCurrency: string;
  cancellingPaymentId: string | null;
  onRecentSearchChange: (value: string) => void;
  onTopDebtorsSearchChange: (value: string) => void;
  onRegularPayersSearchChange: (value: string) => void;
  onNeverPaidSearchChange: (value: string) => void;
  onRequestCancelPayment: (payment: RecentPaymentItem) => void;
};

export default function PaymentSidePanels({
  filteredRecentPayments,
  filteredTopDebtors,
  filteredRegularPayers,
  filteredNeverPaidMembers,
  recentSearch,
  topDebtorsSearch,
  regularPayersSearch,
  neverPaidSearch,
  activeCurrency,
  cancellingPaymentId,
  onRecentSearchChange,
  onTopDebtorsSearchChange,
  onRegularPayersSearchChange,
  onNeverPaidSearchChange,
  onRequestCancelPayment,
}: PaymentSidePanelsProps) {
  return (
    <div className="space-y-6">
      <PaymentSectionCard
        title="Son Tahsilatlar"
        description="Liste büyürse bölüm içinde scroll olur."
        rightSlot={
          <input
            value={recentSearch}
            onChange={(e) => onRecentSearchChange(e.target.value)}
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
                    <span
                      className={`rounded-full px-2.5 py-1 shadow-sm ${
                        payment.status === "Cancelled"
                          ? "border border-rose-200 bg-rose-50 text-rose-700"
                          : "bg-white"
                      }`}
                    >
                      {payment.status === "Cancelled" ? "İptal edildi" : "Tamamlandı"}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1 text-xs text-slate-500">
                    <div>Ödeme tarihi: {formatDate(payment.paidAt)}</div>
                    <div>İşaretleyen: {payment.markedByDisplayName}</div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => onRequestCancelPayment(payment)}
                      disabled={
                        payment.status === "Cancelled" ||
                        cancellingPaymentId === payment.paymentId
                      }
                      className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
      </PaymentSectionCard>

      <PaymentSectionCard
        title="Düzenli Ödeyenler"
        description="Son ödeme kayıt sayısına göre sıralanır."
        rightSlot={
          <input
            value={regularPayersSearch}
            onChange={(e) => onRegularPayersSearchChange(e.target.value)}
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
      </PaymentSectionCard>

      <PaymentSectionCard
        title="Hiç Ödeme Yapmayanlar"
        description="İlk tahsilatı bekleyen üyeler."
        rightSlot={
          <input
            value={neverPaidSearch}
            onChange={(e) => onNeverPaidSearchChange(e.target.value)}
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
      </PaymentSectionCard>
    </div>
  );
}