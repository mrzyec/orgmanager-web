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
          className="rounded-2xl px-5 py-3 text-sm font-medium transition disabled:opacity-60"
          style={{
            backgroundColor: "var(--primary)",
            color: "var(--primary-contrast)",
          }}
        >
          {isSavingAll ? "Uygulanıyor..." : "Aidat Ayarlarını Uygula"}
        </button>
      }
    >
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
        <label
          className="rounded-2xl border p-3"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface-soft)",
          }}
        >
          <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
            Aidat aktif
          </div>
          <select
            value={settingsForm.isEnabled ? "true" : "false"}
            onChange={(e) =>
              onSettingsFormChange({
                ...settingsForm,
                isEnabled: e.target.value === "true",
              })
            }
            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-solid)",
              color: "var(--text)",
            }}
          >
            <option value="true">Açık</option>
            <option value="false">Kapalı</option>
          </select>
        </label>

        <label
          className={`rounded-2xl border p-3 ${controlsDisabled ? "opacity-60" : ""}`}
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface-soft)",
          }}
        >
          <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
            Aidat tipi
          </div>
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
            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none disabled:opacity-60"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-solid)",
              color: "var(--text)",
            }}
          >
            <option value="Monthly">Aylık</option>
            <option value="Yearly">Yıllık</option>
          </select>
        </label>

        <div
          className={`rounded-2xl border p-3 ${controlsDisabled ? "opacity-60" : ""}`}
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface-soft)",
          }}
        >
          <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
            {startDateLabel}
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <select
              value={settingsForm.startDay}
              onChange={(e) =>
                onSettingsFormChange({
                  ...settingsForm,
                  startDay: e.target.value,
                })
              }
              disabled={controlsDisabled || settingsForm.period === "Yearly"}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none disabled:opacity-60"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-solid)",
                color: "var(--text)",
              }}
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
              disabled={controlsDisabled || settingsForm.period === "Yearly"}
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none disabled:opacity-60"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-solid)",
                color: "var(--text)",
              }}
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
              className="w-full rounded-xl border px-3 py-2 text-sm outline-none disabled:opacity-60"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-solid)",
                color: "var(--text)",
              }}
            >
              {YEAR_OPTIONS.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
            {settingsForm.period === "Yearly"
              ? "Yıllık sistemde yalnızca başlangıç yılı esas alınır."
              : "Borç üretimi bu tarihten itibaren başlar."}
          </p>
        </div>
      </div>

      <div
        className={`mt-4 rounded-2xl border p-3 ${controlsDisabled ? "opacity-60" : ""}`}
        style={{
          borderColor: "var(--border)",
          backgroundColor: "var(--surface-soft)",
        }}
      >
        <div className="mb-3">
          <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
            Aidat Planı
          </div>
          <div className="mt-1 space-y-2">
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              {planDescription}
            </p>
            <p className="text-xs" style={{ color: "var(--warning-text)" }}>
              Not: Tamamlanmış ödeme geçmişi olan planlar normal silme ile kaldırılamaz.
              Böyle durumlarda toplu geri al ve sil akışı kullanılmalıdır.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_0.9fr]">
          <label
            className="rounded-2xl border p-3"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-solid)",
            }}
          >
            <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
              {planAmountLabel}
            </div>
            <input
              type="number"
              min="0"
              step="0.01"
              value={planForm.amount}
              onChange={(e) =>
                onPlanFormChange({ ...planForm, amount: e.target.value })
              }
              disabled={controlsDisabled}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none disabled:opacity-60"
              placeholder="Tutar gir"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-solid)",
                color: "var(--text)",
              }}
            />
          </label>

          <label
            className="rounded-2xl border p-3"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-solid)",
            }}
          >
            <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Para birimi
            </div>
            <select
              value={planForm.currency}
              onChange={(e) =>
                onPlanFormChange({
                  ...planForm,
                  currency: e.target.value as "TRY" | "USD" | "EUR",
                })
              }
              disabled={controlsDisabled}
              className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none disabled:opacity-60"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-solid)",
                color: "var(--text)",
              }}
            >
              <option value="TRY">TRY</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
        </div>

        <div
          className="mt-3 flex flex-wrap items-center gap-3 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          <span
            className="rounded-full px-3 py-1.5 shadow-sm"
            style={{ backgroundColor: "var(--surface-solid)" }}
          >
            Plan yılı: {settingsForm.startYear || "—"}
          </span>
          <span
            className="rounded-full px-3 py-1.5 shadow-sm"
            style={{ backgroundColor: "var(--surface-solid)" }}
          >
            Tip: {settingsForm.period === "Yearly" ? "Yıllık" : "Aylık"}
          </span>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr
                className="border-b text-left"
                style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
              >
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
                  <td
                    colSpan={7}
                    className="px-3 py-6 text-center"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Bu aidat tipine uygun plan henüz tanımlanmadı.
                  </td>
                </tr>
              ) : (
                compatiblePlans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-b"
                    style={{
                      borderColor: "var(--border)",
                      color: "var(--text)",
                      backgroundColor:
                        selectedPlanYear === plan.year
                          ? "var(--surface-soft)"
                          : "transparent",
                    }}
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
                        className="rounded-2xl border px-3 py-2 text-xs font-medium transition hover:brightness-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          borderColor: "var(--border)",
                          backgroundColor: "var(--surface-solid)",
                          color: "var(--text)",
                        }}
                      >
                        {deletingPlanYear === plan.year ? "İşleniyor..." : "Plan işlemleri"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div
          className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-4 py-3"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface-solid)",
          }}
        >
          <div>
            <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
              Plan revizyonları
            </div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>
              İhtiyaç halinde açıp yeni revizyon ekleyebilirsin.
            </div>
          </div>

          <button
            type="button"
            onClick={onToggleRevisionPanel}
            disabled={controlsDisabled}
            className="rounded-2xl border px-4 py-2 text-sm font-medium transition hover:brightness-[0.98] disabled:opacity-60"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-solid)",
              color: "var(--text)",
            }}
          >
            {isRevisionPanelOpen
              ? "Revizyon alanını kapat"
              : "Revizyon alanını aç"}
          </button>
        </div>
      </div>

      {isRevisionPanelOpen ? (
        <div
          className={`mt-4 rounded-2xl border p-3 ${controlsDisabled ? "opacity-60" : ""}`}
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface-soft)",
          }}
        >
          <div className="mb-3">
            <div className="text-sm font-semibold" style={{ color: "var(--text)" }}>
              Plan Revizyonu
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {revisionDescription}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.1fr_1fr_0.8fr_auto]">
            <div
              className="rounded-2xl border p-3"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-solid)",
              }}
            >
              <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                {revisionDateLabel}
              </div>

              <div className="mt-2 grid grid-cols-3 gap-2">
                <select
                  value={revisionForm.effectiveDay}
                  onChange={(e) =>
                    onRevisionFormChange({
                      ...revisionForm,
                      effectiveDay: e.target.value,
                    })
                  }
                  disabled={controlsDisabled || settingsForm.period === "Monthly"}
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none disabled:opacity-60"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-solid)",
                    color: "var(--text)",
                  }}
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
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none disabled:opacity-60"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-solid)",
                    color: "var(--text)",
                  }}
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
                  className="w-full rounded-xl border px-3 py-2 text-sm outline-none disabled:opacity-60"
                  style={{
                    borderColor: "var(--border)",
                    backgroundColor: "var(--surface-solid)",
                    color: "var(--text)",
                  }}
                >
                  {YEAR_OPTIONS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label
              className="rounded-2xl border p-3"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-solid)",
              }}
            >
              <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
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
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none disabled:opacity-60"
                placeholder="Tutar gir"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-solid)",
                  color: "var(--text)",
                }}
              />
            </label>

            <label
              className="rounded-2xl border p-3"
              style={{
                borderColor: "var(--border)",
                backgroundColor: "var(--surface-solid)",
              }}
            >
              <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                Para birimi
              </div>
              <select
                value={revisionForm.currency}
                onChange={(e) =>
                  onRevisionFormChange({
                    ...revisionForm,
                    currency: e.target.value as "TRY" | "USD" | "EUR",
                  })
                }
                disabled={controlsDisabled}
                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm outline-none disabled:opacity-60"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-solid)",
                  color: "var(--text)",
                }}
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
                className="w-full rounded-2xl px-4 py-3 text-sm font-medium transition disabled:opacity-60"
                style={{
                  backgroundColor: "var(--primary)",
                  color: "var(--primary-contrast)",
                }}
              >
                {isAddingRevision ? "Ekleniyor..." : "Revizyon Ekle"}
              </button>
            </div>
          </div>

          <div className="mt-4">
            <div className="mb-2 text-sm font-medium" style={{ color: "var(--text)" }}>
              Seçili planın revizyon geçmişi
            </div>

            {!selectedPlan || !selectedPlan.revisions?.length ? (
              <div
                className="rounded-2xl border border-dashed p-4 text-sm"
                style={{
                  borderColor: "var(--border)",
                  backgroundColor: "var(--surface-solid)",
                  color: "var(--text-muted)",
                }}
              >
                Seçili plan için revizyon kaydı bulunmuyor.
              </div>
            ) : (
              <div className="space-y-2">
                {[...selectedPlan.revisions]
                  .sort((a, b) => a.revisionNo - b.revisionNo)
                  .map((revision: OrganizationPaymentPlanRevisionDto) => (
                    <div
                      key={revision.id}
                      className="flex flex-col gap-2 rounded-2xl border p-3 md:flex-row md:items-center md:justify-between"
                      style={{
                        borderColor: "var(--border)",
                        backgroundColor: "var(--surface-solid)",
                      }}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className="rounded-full px-2.5 py-1 text-xs font-medium"
                            style={{
                              backgroundColor: "var(--primary)",
                              color: "var(--primary-contrast)",
                            }}
                          >
                            Revizyon #{revision.revisionNo}
                          </span>
                          <span
                            className="rounded-full border px-2.5 py-1 text-xs"
                            style={{
                              borderColor: "var(--border)",
                              backgroundColor: "var(--surface-soft)",
                              color: "var(--text-muted)",
                            }}
                          >
                            Başlangıç:{" "}
                            {formatRevisionDateLabel(
                              revision.effectiveFromUtc,
                              revision.period
                            )}
                          </span>
                          <span
                            className="rounded-full border px-2.5 py-1 text-xs"
                            style={{
                              borderColor: "var(--border)",
                              backgroundColor: "var(--surface-soft)",
                              color: "var(--text-muted)",
                            }}
                          >
                            {revision.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </div>

                        <div className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
                          Tutar:{" "}
                          <span className="font-semibold" style={{ color: "var(--text)" }}>
                            {formatCurrency(revision.amount, revision.currency)}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>
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