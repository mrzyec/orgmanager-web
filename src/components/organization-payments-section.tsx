"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { AppButton, AppCard } from "@/components/ui";
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

function formatDateOnly(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
  }).format(date);
}

function toInputDate(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function formatAmount(amount?: number | null, currency?: string | null) {
  if (amount === null || amount === undefined) return "-";
  return `${amount} ${currency ?? ""}`.trim();
}

function getPeriodLabel(period?: PaymentPeriod | string | null) {
  if (!period) return "-";
  return period === "Monthly" ? "Aylık" : "Yıllık";
}

function getMemberStatusTone(member: OrganizationMemberPaymentStatusDto) {
  return member.isOverdue ? "yellow" : "neutral";
}

function getMemberStatusLabel(member: OrganizationMemberPaymentStatusDto) {
  return member.isOverdue ? "Gecikmiş" : "Güncel";
}

function canMarkPaid(member: OrganizationMemberPaymentStatusDto) {
  return member.isOverdue;
}

const CURRENCY_OPTIONS = [
  "TRY",
  "USD",
  "EUR",
  "GBP",
  "CHF",
  "JPY",
  "CAD",
  "AUD",
  "SAR",
  "AED",
  "QAR",
  "KWD",
  "BHD",
  "OMR",
  "NOK",
  "SEK",
  "DKK",
  "RUB",
  "CNY",
  "INR",
  "PKR",
  "AZN",
  "GEL",
  "KZT",
  "UZS",
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
  "NZD",
];

type Props = {
  organizationId: string;
  canManagePayments: boolean;
};

function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[24px] border border-gray-200 bg-slate-50 p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-base font-semibold text-gray-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-gray-500">{hint}</div> : null}
    </div>
  );
}

function MemberInfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-gray-900 break-words">
        {value}
      </div>
    </div>
  );
}

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
      setCurrency(settingsData.currency?.trim() ? settingsData.currency : "TRY");
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

  const currentCount = useMemo(
    () => members.filter((x) => !x.isOverdue).length,
    [members]
  );

  const activeMemberCount = useMemo(
    () => members.filter((x) => x.isMemberActive).length,
    [members]
  );

  const currentAmountPreview = useMemo(() => {
    if (!isEnabled) return "Aidat sistemi kapalı";
    if (!amount.trim()) return `- ${currency}`;
    return `${amount} ${currency}`.trim();
  }, [amount, currency, isEnabled]);

  async function handleSave() {
    if (!canManagePayments) return;

    const normalizedAmountText = amount.trim().replace(",", ".");
    const parsedAmount =
      normalizedAmountText === "" ? null : Number(normalizedAmountText);

    const trimmedStartDate = startDate.trim();

    if (isEnabled) {
      if (amount.trim() === "") {
        showToast({
          message: "Aidat sistemi açıkken tutar zorunludur.",
          type: "error",
        });
        return;
      }

      if (parsedAmount === null || Number.isNaN(parsedAmount)) {
        showToast({
          message: "Tutar geçerli bir sayı olmalıdır.",
          type: "error",
        });
        return;
      }

      if (parsedAmount < 0) {
        showToast({
          message: "Tutar 0 veya daha büyük olmalıdır.",
          type: "error",
        });
        return;
      }

      if (!currency.trim()) {
        showToast({
          message: "Aidat sistemi açıkken para birimi zorunludur.",
          type: "error",
        });
        return;
      }

      if (!trimmedStartDate) {
        showToast({
          message: "Aidat sistemi açıkken başlangıç tarihi zorunludur.",
          type: "error",
        });
        return;
      }
    }

    setSaving(true);

    try {
      const requestBody = {
        isEnabled,
        period,
        amount: isEnabled ? parsedAmount : null,
        currency: isEnabled ? currency : null,
        startDateUtc: isEnabled
          ? new Date(`${trimmedStartDate}T00:00:00`).toISOString()
          : null,
      };

      const updated = await updateOrganizationPaymentSettings(
        organizationId,
        requestBody
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
    if (!canMarkPaid(member)) return;

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
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-sm text-gray-500">Aidat / ödeme yönetimi</div>
          <div className="mt-1 text-xl font-semibold tracking-tight text-gray-900">
            Aidat ayarları ve üye ödeme durumu
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
            Organizasyonun aidat sistemini açabilir veya kapatabilir, periyot ve
            tutar belirleyebilir, üyelerin ödeme durumlarını buradan takip
            edebilirsin.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill
            label={isEnabled ? "Aidat sistemi açık" : "Aidat sistemi kapalı"}
            active={isEnabled}
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
        <div className="mb-4 text-sm text-gray-600">Ödeme bilgileri yükleniyor...</div>
      ) : null}

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryStat
          label="Aidat sistemi"
          value={isEnabled ? "Açık" : "Kapalı"}
          hint={isEnabled ? "Aidat takibi aktif" : "Organizasyon aidat almıyor"}
        />
        <SummaryStat
          label="Periyot"
          value={getPeriodLabel(period)}
          hint="Aylık / yıllık tahsilat tipi"
        />
        <SummaryStat
          label="Aidat tutarı"
          value={currentAmountPreview}
          hint="Organizasyon bazlı sabit tutar"
        />
        <SummaryStat
          label="Başlangıç tarihi"
          value={isEnabled ? formatDateOnly(startDate || settings?.startDateUtc) : "-"}
          hint="İlk ödeme takibi başlangıcı"
        />
        <SummaryStat
          label="Aidat ayarları son güncelleme"
          value={formatUtcDate(settings?.updatedAtUtc)}
          hint="Settings kaydının son değişim zamanı"
        />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryStat
          label="Toplam üye"
          value={String(members.length)}
          hint="Ödeme takibindeki üyeler"
        />
        <SummaryStat
          label="Aktif üye"
          value={String(activeMemberCount)}
          hint="Üyeliği aktif olanlar"
        />
        <SummaryStat
          label="Güncel ödeme"
          value={String(currentCount)}
          hint="Gecikmesi olmayan üyeler"
        />
        <SummaryStat
          label="Gecikmiş ödeme"
          value={String(overdueCount)}
          hint="Ödeme günü geçmiş üyeler"
        />
      </div>

      <div className="grid gap-6 2xl:grid-cols-[440px_minmax(0,1fr)]">
        <div className="rounded-[28px] border border-gray-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-5 shadow-sm">
          <div className="mb-5">
            <div className="text-sm text-gray-500">Aidat ayarları</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
              Takip yapılandırması
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <div className="text-sm text-gray-600">Aidat sistemi aktif mi?</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setIsEnabled(true)}
                  disabled={!canManagePayments || saving}
                  className={`rounded-3xl px-5 py-3 text-sm font-medium transition ${
                    isEnabled
                      ? "border border-slate-900 bg-slate-900 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  Açık
                </button>

                <button
                  type="button"
                  onClick={() => setIsEnabled(false)}
                  disabled={!canManagePayments || saving}
                  className={`rounded-3xl px-5 py-3 text-sm font-medium transition ${
                    !isEnabled
                      ? "border border-slate-900 bg-slate-900 text-white"
                      : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  Kapalı
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">Ödeme periyodu</div>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PaymentPeriod)}
                disabled={!canManagePayments || saving}
                className="w-full rounded-3xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                <option value="Monthly">Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">Tutar</div>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={!canManagePayments || saving || !isEnabled}
                placeholder="Örn: 250"
                className="w-full rounded-3xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">Para birimi</div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={!canManagePayments || saving || !isEnabled}
                className="w-full rounded-3xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
              >
                {CURRENCY_OPTIONS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="text-sm text-gray-600">Başlangıç tarihi</div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={!canManagePayments || saving || !isEnabled}
                className="w-full rounded-3xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100"
              />
            </div>
          </div>

          {!isEnabled ? (
            <div className="mt-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              Aidat sistemi kapalıyken organizasyon aidat almıyor kabul edilir.
              Bu durumda tutar, para birimi ve başlangıç tarihi zorunlu değildir.
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

        <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5">
            <div className="text-sm text-gray-500">Üye ödeme listesi</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
              Ödeme durumu takibi
            </div>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Her üye için aidat durumu, ödenecek tutar, sonraki vade ve işlem
              durumu burada görüntülenir.
            </p>
          </div>

          {!isEnabled ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm leading-6 text-gray-600">
              Bu organizasyonda aidat sistemi şu an kapalı. Aidat takibini
              başlatmak için sistemi açıp ayarları kaydet.
            </div>
          ) : members.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-6 text-sm leading-6 text-gray-600">
              Aidat sistemi açık ve kaydedilmiş olduğunda üye ödeme durumları
              burada oluşacaktır.
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => {
                const memberCanMarkPaid = canMarkPaid(member);

                return (
                  <div
                    key={member.organizationMemberId}
                    className="rounded-3xl border border-gray-200 bg-slate-50 p-5"
                  >
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="min-w-0">
                          <div className="text-xl font-semibold tracking-tight text-gray-900 break-all">
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
                              label={getMemberStatusLabel(member)}
                              active={member.isOverdue}
                              tone={getMemberStatusTone(member)}
                            />
                          </div>
                        </div>

                        {canManagePayments ? (
                          <div className="flex shrink-0">
                            <AppButton
                              onClick={() => handleMarkPaid(member)}
                              disabled={
                                saving ||
                                !memberCanMarkPaid ||
                                markingMemberId === member.organizationMemberId
                              }
                            >
                              {markingMemberId === member.organizationMemberId
                                ? "İşleniyor..."
                                : memberCanMarkPaid
                                ? "Ödendi olarak işaretle"
                                : "Ödeme durumu güncel"}
                            </AppButton>
                          </div>
                        ) : null}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                        <MemberInfoBlock
                          label="Ödenecek tutar"
                          value={formatAmount(settings?.amount, settings?.currency)}
                        />
                        <MemberInfoBlock
                          label="Periyot"
                          value={getPeriodLabel(settings?.period)}
                        />
                        <MemberInfoBlock
                          label="Son ödeme"
                          value={formatUtcDate(member.lastPaidAtUtc)}
                        />
                        <MemberInfoBlock
                          label="Sonraki vade"
                          value={formatUtcDate(member.nextDueDateUtc)}
                        />
                        <MemberInfoBlock
                          label="Gecikme başlangıcı"
                          value={formatUtcDate(member.overdueSinceUtc)}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppCard>
  );
}