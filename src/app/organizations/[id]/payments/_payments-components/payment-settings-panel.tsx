"use client";

import PaymentSectionCard from "./payment-section-card";
import {
  formatCurrency,
  formatDate,
  formatRevisionDateLabel,
} from "../_payments-lib/payment-formatters";
import type {
  PlanFormState,
  RevisionFormState,
  SettingsFormState,
} from "../_payments-lib/payment-page-types";
import type {
  OrganizationPaymentPlanDto,
  OrganizationPaymentPlanRevisionDto,
} from "@/lib/api";

const DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => String(i + 1));
const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) =>
  String(new Date().getFullYear() - 2 + i)
);

type PaymentSettingsPanelProps = {
  isOpen: boolean;
  isSavingAll: boolean;
  isAddingRevision: boolean;
  controlsDisabled: boolean;
  settingsForm: SettingsFormState;
  planForm: PlanFormState;
  revisionForm: RevisionFormState;
  compatiblePlans: OrganizationPaymentPlanDto[];
  selectedPlanYear: number | null;
  selectedPlan: OrganizationPaymentPlanDto | null;
  deletingPlanYear: number | null;
  isRevisionPanelOpen: boolean;
  onToggleOpen: () => void;
  onSaveAll: () => void;
  onSettingsFormChange: (next: SettingsFormState) => void;
  onPlanFormChange: (next: PlanFormState) => void;
  onRevisionFormChange: (next: RevisionFormState) => void;
  onToggleRevisionPanel: () => void;
  onAddRevision: () => void;
  onDeletePlan: (plan: OrganizationPaymentPlanDto) => void;
};

export default function PaymentSettingsPanel({
  isOpen,
  isSavingAll,
  isAddingRevision,
  controlsDisabled,
  settingsForm,
  planForm,
  revisionForm,
  compatiblePlans,
  selectedPlanYear,
  selectedPlan,
  deletingPlanYear,
  isRevisionPanelOpen,
  onSaveAll,
  onSettingsFormChange,
  onPlanFormChange,
  onRevisionFormChange,
  onToggleRevisionPanel,
  onAddRevision,
  onDeletePlan,
}: PaymentSettingsPanelProps) {
  const planDescription =
    settingsForm.period === "Yearly"
      ? "Bu alanda seçilen yıl için yıllık aidat tutarını belirlersin."
      : "Bu alanda seçilen yıl için aylık aidat tutarını belirlersin.";

  const revisionDescription =
    settingsForm.period === "Yearly"
      ? "Yıllık sistemde aynı yıl içinde yeni bir toplam aidat tutarı tanımlarsın. Önceden ödeme yapanlarda fark borç oluşur."
      : "Aylık sistemde belirli tarihten itibaren yeni dönem tutarı tanımlarsın.";

  const planAmountLabel =
    settingsForm.period === "Yearly" ? "Yıllık tutar" : "Aylık tutar";

  const startDateLabel =
    settingsForm.period === "Yearly" ? "Başlangıç yılı" : "Başlangıç tarihi";

  const revisionDateLabel = "Revizyon başlangıç tarihi";

  if (!isOpen) return null;

  return (
    <PaymentSectionCard
      title="Aidat Sistemi"
      description="Aidat tipini seç. Aylıkta tam tarih, yıllıkta sadece yıl esas alınır."
      rightSlot={
        <button
          type="button"
          onClick={onSaveAll}
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
              onSettingsFormChange({
                ...settingsForm,
                isEnabled: e.target.value === "true",
              })
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

              onSettingsFormChange({
                ...settingsForm,
                period: nextPeriod,
                startDay: "1",
                startMonth: "1",
              });
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
                onSettingsFormChange({
                  ...settingsForm,
                  startDay: e.target.value,
                })
              }
              disabled={controlsDisabled}
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
                onSettingsFormChange({
                  ...settingsForm,
                  startMonth: e.target.value,
                })
              }
              disabled={controlsDisabled}
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
                onSettingsFormChange({
                  ...settingsForm,
                  startYear: e.target.value,
                })
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
          <div className="mt-1 space-y-2">
            <p className="text-sm text-slate-500">{planDescription}</p>
            <p className="text-xs text-amber-700">
              Not: Bu yıl için ödeme alınmışsa plan silinemez.
            </p>
          </div>
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
                onPlanFormChange({ ...planForm, amount: e.target.value })
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
                onPlanFormChange({
                  ...planForm,
                  currency: e.target.value as "TRY" | "USD" | "EUR",
                })
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
                <th className="px-3 py-3">Revizyon</th>
                <th className="px-3 py-3">Güncellendi</th>
                <th className="px-3 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {compatiblePlans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
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
                    <td className="px-3 py-3">
                      {plan.revisions?.length ? `${plan.revisions.length} kayıt` : "—"}
                    </td>
                    <td className="px-3 py-3">{formatDate(plan.updatedAtUtc)}</td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onDeletePlan(plan)}
                        disabled={deletingPlanYear === plan.year}
                        className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingPlanYear === plan.year ? "Siliniyor..." : "Planı sil"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <div>
            <div className="text-sm font-medium text-slate-900">Plan revizyonları</div>
            <div className="text-xs text-slate-500">
              İhtiyaç halinde açıp yeni revizyon ekleyebilirsin.
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleRevisionPanel}
            disabled={controlsDisabled}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {isRevisionPanelOpen
              ? "Revizyon alanını kapat"
              : "Revizyon alanını aç"}
          </button>
        </div>
      </div>

      {isRevisionPanelOpen ? (
        <div
          className={`mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 ${
            controlsDisabled ? "opacity-60" : ""
          }`}
        >
          <div className="mb-3">
            <div className="text-sm font-semibold text-slate-900">Plan Revizyonu</div>
            <p className="mt-1 text-sm text-slate-500">{revisionDescription}</p>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.1fr_1fr_0.8fr_auto]">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-sm font-medium text-slate-700">{revisionDateLabel}</div>

              <div className="mt-2 grid grid-cols-3 gap-2">
                <select
                  value={revisionForm.effectiveDay}
                  onChange={(e) =>
                    onRevisionFormChange({
                      ...revisionForm,
                      effectiveDay: e.target.value,
                    })
                  }
                  disabled={controlsDisabled}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {DAY_OPTIONS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>

                <select
                  value={revisionForm.effectiveMonth}
                  onChange={(e) =>
                    onRevisionFormChange({
                      ...revisionForm,
                      effectiveMonth: e.target.value,
                    })
                  }
                  disabled={controlsDisabled}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                >
                  {MONTH_OPTIONS.map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>

                <select
                  value={revisionForm.effectiveYear}
                  onChange={(e) =>
                    onRevisionFormChange({
                      ...revisionForm,
                      effectiveYear: e.target.value,
                    })
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
            </div>

            <label className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-sm font-medium text-slate-700">
                {settingsForm.period === "Yearly" ? "Yeni yıllık tutar" : "Yeni dönem tutarı"}
              </div>
              <input
                type="number"
                min="0"
                step="0.01"
                value={revisionForm.amount}
                onChange={(e) =>
                  onRevisionFormChange({
                    ...revisionForm,
                    amount: e.target.value,
                  })
                }
                disabled={controlsDisabled}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400"
                placeholder="Tutar gir"
              />
            </label>

            <label className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="text-sm font-medium text-slate-700">Para birimi</div>
              <select
                value={revisionForm.currency}
                onChange={(e) =>
                  onRevisionFormChange({
                    ...revisionForm,
                    currency: e.target.value as "TRY" | "USD" | "EUR",
                  })
                }
                disabled={controlsDisabled}
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="TRY">TRY</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                onClick={onAddRevision}
                disabled={controlsDisabled || isAddingRevision}
                className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {isAddingRevision ? "Ekleniyor..." : "Revizyon Ekle"}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-sm font-medium text-slate-700">
              Seçili planın revizyon geçmişi
            </div>

            {!selectedPlan || !selectedPlan.revisions?.length ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
                Seçili plan için revizyon kaydı bulunmuyor.
              </div>
            ) : (
              <div className="space-y-2">
                {[...selectedPlan.revisions]
                  .sort((a, b) => a.revisionNo - b.revisionNo)
                  .map((revision: OrganizationPaymentPlanRevisionDto) => (
                    <div
                      key={revision.id}
                      className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                            Revizyon #{revision.revisionNo}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                            Başlangıç:{" "}
                            {formatRevisionDateLabel(
                              revision.effectiveFromUtc,
                              revision.period
                            )}
                          </span>
                          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-600">
                            {revision.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </div>

                        <div className="mt-2 text-sm text-slate-600">
                          Tutar:{" "}
                          <span className="font-semibold text-slate-900">
                            {formatCurrency(revision.amount, revision.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500">
                        Güncelleme: {formatDate(revision.updatedAtUtc)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </PaymentSectionCard>
  );
}