"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { AppButton, AppCard } from "@/components/ui";
import { ReadonlyField } from "@/components/detail-ui";
import { StatusPill } from "@/components/badges";
import {
  getOrganizationMemberPaymentStatuses,
  getOrganizationPaymentSettings,
  markOrganizationMemberPaid,
  updateOrganizationPaymentSettings,
  type OrganizationMemberPaymentStatusDto,
  type OrganizationPaymentSettingsDto,
  type PaymentPeriod,
} from "@/lib/payments";

function formatUtcDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function toInputDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount === null || amount === undefined) return "-";

  const safeCurrency = currency?.trim() || "TRY";

  try {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: safeCurrency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount} ${safeCurrency}`;
  }
}

function getPeriodLabel(period: PaymentPeriod) {
  return period === "Yearly" ? "Yıllık" : "Aylık";
}

function PaymentInfoBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/90 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-words text-sm font-semibold text-slate-900">
        {value}
      </div>
    </div>
  );
}

type Props = {
  organizationId: string;
  canManagePayments: boolean;
};

const CURRENCY_OPTIONS = [
  "TRY",
  "USD",
  "EUR",
  "GBP",
  "AED",
  "SAR",
  "QAR",
  "KWD",
  "BHD",
  "JPY",
  "CNY",
  "RUB",
  "CHF",
  "CAD",
  "AUD",
  "SEK",
  "NOK",
  "DKK",
  "PLN",
  "CZK",
  "HUF",
  "RON",
  "BGN",
  "AZN",
  "GEL",
  "KZT",
  "UZS",
  "INR",
  "PKR",
  "EGP",
  "ZAR",
  "BRL",
  "MXN",
  "KRW",
  "SGD",
  "HKD",
  "MYR",
  "THB",
  "IDR",
  "PHP",
  "VND",
];

export default function OrganizationPaymentsSection({
  organizationId,
  canManagePayments,
}: Props) {
  const { showToast } = useToast();

  const [settings, setSettings] = useState<OrganizationPaymentSettingsDto | null>(
    null
  );
  const [members, setMembers] = useState<OrganizationMemberPaymentStatusDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [markingMemberId, setMarkingMemberId] = useState<string | null>(null);

  const [isEnabled, setIsEnabled] = useState(false);
  const [period, setPeriod] = useState<PaymentPeriod>("Monthly");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("TRY");
  const [startDate, setStartDate] = useState("");

  async function loadData(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;

    if (!silent) setLoading(true);

    try {
      const [settingsData, membersData] = await Promise.all([
        getOrganizationPaymentSettings(organizationId),
        getOrganizationMemberPaymentStatuses(organizationId),
      ]);

      setSettings(settingsData);
      setMembers(membersData);

      setIsEnabled(settingsData.isEnabled);
      setPeriod(settingsData.period);
      setAmount(
        settingsData.amount === null || settingsData.amount === undefined
          ? ""
          : String(settingsData.amount)
      );
      setCurrency(settingsData.currency?.trim() || "TRY");
      setStartDate(toInputDate(settingsData.startDateUtc));
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Ödeme bilgileri yüklenemedi.",
        type: "error",
      });
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [organizationId]);

  const overdueCount = useMemo(
    () => members.filter((x) => x.isOverdue).length,
    [members]
  );

  async function handleSave() {
    setSaving(true);

    try {
      const parsedAmount =
        amount.trim() === "" ? null : Number(amount.trim().replace(",", "."));

      if (parsedAmount !== null && Number.isNaN(parsedAmount)) {
        showToast({ message: "Tutar geçerli bir sayı olmalıdır.", type: "error" });
        return;
      }

      const payload = isEnabled
        ? {
            isEnabled: true,
            period,
            amount: parsedAmount,
            currency: currency.trim() || "TRY",
            startDateUtc: startDate
              ? new Date(`${startDate}T00:00:00Z`).toISOString()
              : null,
          }
        : {
            isEnabled: false,
            period,
            amount: null,
            currency: "TRY",
            startDateUtc: null,
          };

      const updated = await updateOrganizationPaymentSettings(
        organizationId,
        payload
      );

      setSettings(updated);

      showToast({
        message: "Aidat ayarları başarıyla kaydedildi.",
        type: "success",
      });

      await loadData({ silent: true });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Aidat ayarları kaydedilemedi.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleMarkPaid(member: OrganizationMemberPaymentStatusDto) {
    setMarkingMemberId(member.organizationMemberId);

    try {
      await markOrganizationMemberPaid(organizationId, member.organizationMemberId, {
        paidAtUtc: new Date().toISOString(),
      });

      showToast({
        message: `${member.email} için ödeme işlendi.`,
        type: "success",
      });

      await loadData({ silent: true });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Ödeme işaretlenemedi.",
        type: "error",
      });
    } finally {
      setMarkingMemberId(null);
    }
  }

  return (
    <AppCard>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="text-sm text-slate-500">Aidat / ödeme yönetimi</div>
          <div className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Aidat ayarları ve üye ödeme durumu
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Her üye için aidat durumu, ödenecek tutar, sonraki vade ve işlem
            durumu burada görüntülenir.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill
            label={settings?.isEnabled ? "Takip aktif" : "Takip kapalı"}
            active={!!settings?.isEnabled}
            tone="green"
          />
          <StatusPill
            label={`Geciken: ${overdueCount}`}
            active={overdueCount > 0}
            tone={overdueCount > 0 ? "yellow" : "neutral"}
          />
          <StatusPill
            label={`Üye: ${members.length}`}
            active={members.length > 0}
            tone="blue"
          />
        </div>
      </div>

      {loading ? (
        <div className="mb-4 text-sm text-slate-600">
          Ödeme bilgileri yükleniyor...
        </div>
      ) : null}

      <div className="space-y-6">
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-5 shadow-sm">
          <div className="mb-5">
            <div className="text-sm text-slate-500">Aidat ayarları</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              Takip yapılandırması
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="space-y-2 sm:col-span-2 xl:col-span-4">
              <div className="text-sm text-slate-600">Aidat sistemi aktif mi?</div>
              <div className="flex flex-wrap gap-2">
                <AppButton
                  onClick={() => setIsEnabled(true)}
                  disabled={!canManagePayments || saving}
                  tone={isEnabled ? "primary" : "secondary"}
                >
                  Açık
                </AppButton>

                <AppButton
                  onClick={() => setIsEnabled(false)}
                  disabled={!canManagePayments || saving}
                  tone={!isEnabled ? "primary" : "secondary"}
                >
                  Kapalı
                </AppButton>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-slate-600">Ödeme periyodu</div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PaymentPeriod)}
                disabled={!canManagePayments || saving}
                className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-slate-600">Tutar</div>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!canManagePayments || saving || !isEnabled}
                placeholder="Örn: 250"
                className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-slate-600">Para birimi</div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={!canManagePayments || saving || !isEnabled}
                className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {CURRENCY_OPTIONS.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-slate-600">Başlangıç tarihi</div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!canManagePayments || saving || !isEnabled}
                className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 disabled:cursor-not-allowed disabled:bg-slate-100"
              />
            </div>

            <ReadonlyField
              label="Mevcut başlangıç tarihi"
              value={formatUtcDate(settings?.startDateUtc)}
            />
            <ReadonlyField
              label="Son güncelleme"
              value={formatUtcDate(settings?.updatedAtUtc)}
            />
          </div>

          {!isEnabled ? (
            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Aidat sistemi kapalıyken tutar, para birimi ve başlangıç tarihi
              zorunlu değildir.
            </div>
          ) : null}

          {canManagePayments ? (
            <div className="mt-5">
              <AppButton onClick={handleSave} disabled={saving}>
                {saving ? "Kaydediliyor..." : "Aidat ayarlarını kaydet"}
              </AppButton>
            </div>
          ) : (
            <div className="mt-5 rounded-3xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
              Aidat ayarlarını yalnızca Owner veya SuperAdmin değiştirebilir.
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <div className="text-sm text-slate-500">Üye ödeme listesi</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              Ödeme durumu takibi
            </div>
          </div>

          {members.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Aidat sistemi açık ve kaydedilmiş olduğunda üye ödeme durumları burada
              oluşacaktır.
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div
                  key={member.organizationMemberId}
                  className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-slate-50 p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="break-all text-lg font-semibold tracking-tight text-slate-900">
                          {member.email}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusPill label={member.role} active tone="blue" />
                          <StatusPill
                            label={member.isMemberActive ? "Üye aktif" : "Üye pasif"}
                            active={member.isMemberActive}
                            tone="green"
                          />
                          <StatusPill
                            label={member.isOverdue ? "Gecikmiş" : "Ödeme durumu güncel"}
                            active={member.isOverdue}
                            tone={member.isOverdue ? "yellow" : "neutral"}
                          />
                        </div>
                      </div>

                      {canManagePayments ? (
                        <div className="flex shrink-0 justify-start md:justify-end">
                          <AppButton
                            onClick={() => handleMarkPaid(member)}
                            disabled={
                              saving ||
                              markingMemberId === member.organizationMemberId
                            }
                          >
                            {markingMemberId === member.organizationMemberId
                              ? "İşleniyor..."
                              : "Ödendi olarak işaretle"}
                          </AppButton>
                        </div>
                      ) : null}
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <PaymentInfoBox
                        label="Ödenecek tutar"
                        value={formatMoney(settings?.amount, settings?.currency)}
                      />
                      <PaymentInfoBox
                        label="Periyot"
                        value={getPeriodLabel(settings?.period ?? "Monthly")}
                      />
                      <PaymentInfoBox
                        label="Son ödeme"
                        value={formatUtcDate(member.lastPaidAtUtc)}
                      />
                      <PaymentInfoBox
                        label="Sonraki vade"
                        value={formatUtcDate(member.nextDueDateUtc)}
                      />
                      <PaymentInfoBox
                        label="Gecikme başlangıcı"
                        value={formatUtcDate(member.overdueSinceUtc)}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppCard>
  );
}