"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { AppCard } from "@/components/ui";
import { ReadonlyField } from "@/components/detail-ui";
import OrganizationSectionShell from "@/components/organization-section-shell";
import { useOrganizationPageData } from "@/hooks/use-organization-page-data";
import {
  getOrganizationOverviewSummary,
  type OrganizationOverviewSummaryDto,
} from "@/lib/organization-overview-api";

function formatUtcDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPaymentPeriod(value?: "Monthly" | "Yearly" | null) {
  if (value === "Monthly") return "Aylık";
  if (value === "Yearly") return "Yıllık";
  return "-";
}

function formatMoney(amount?: number | null, currency?: string | null) {
  if (amount === null || amount === undefined) return "-";

  const formatted = new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);

  return currency ? `${formatted} ${currency}` : formatted;
}

function SummaryStatCard({
  title,
  value,
  description,
  tone = "default",
  href,
  meta,
}: {
  title: string;
  value: string | number;
  description: string;
  tone?: "default" | "green" | "yellow" | "blue";
  href: string;
  meta?: string;
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-gradient-to-br from-emerald-50 to-white"
      : tone === "yellow"
      ? "border-amber-200 bg-gradient-to-br from-amber-50 to-white"
      : tone === "blue"
      ? "border-blue-200 bg-gradient-to-br from-blue-50 to-white"
      : "border-slate-200 bg-gradient-to-br from-slate-50 to-white";

  return (
    <Link
      href={href}
      className={`group block rounded-[24px] border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg active:translate-y-[1px] active:scale-[0.995] ${toneClass}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm text-slate-600">{title}</div>
        <span className="text-xs font-medium text-slate-500 transition-transform duration-200 group-hover:translate-x-0.5">
          İncele →
        </span>
      </div>

      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>

      <div className="mt-2 text-sm leading-6 text-slate-600">{description}</div>

      {meta ? (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-xs font-medium leading-5 text-slate-600">
          {meta}
        </div>
      ) : null}
    </Link>
  );
}

const DEFAULT_SUMMARY: OrganizationOverviewSummaryDto = {
  pendingRequestCount: 0,
  paymentEnabled: false,
  overdueCount: 0,
  paymentPeriod: null,
  paymentAmount: null,
  paymentCurrency: null,
  unpaidDebtTotalAmount: null,
};

export default function OrganizationOverviewClient({ id }: { id: string }) {
  const { showToast } = useToast();
  const [pageError, setPageError] = useState<string | null>(null);
  const [summary, setSummary] =
    useState<OrganizationOverviewSummaryDto>(DEFAULT_SUMMARY);

  const { org, me, members, loading, canManageOrganization } =
    useOrganizationPageData(id);

  useEffect(() => {
    let cancelled = false;

    async function loadOverviewSummary() {
      try {
        const data = await getOrganizationOverviewSummary(id);

        if (cancelled) return;
        setSummary(data);
      } catch (e: any) {
        if (cancelled) return;

        setPageError(e?.message ?? "Özet veriler yüklenemedi.");
        showToast({
          message: e?.message ?? "Özet veriler yüklenemedi.",
          type: "error",
        });
      }
    }

    loadOverviewSummary();

    return () => {
      cancelled = true;
    };
  }, [id, showToast]);

  const activeMemberCount = useMemo(
    () => members.filter((x) => x.isActive).length,
    [members]
  );

  const membersHref = `/organizations/${id}/members`;
  const requestsHref = `/organizations/${id}/requests`;
  const paymentsHref = `/organizations/${id}/payments`;

  const paymentMeta = summary.paymentEnabled
    ? `${formatPaymentPeriod(summary.paymentPeriod)} · ${formatMoney(
        summary.paymentAmount,
        summary.paymentCurrency
      )}`
    : "Aidat takibi kapalı";

  const overdueMeta = summary.paymentEnabled
    ? summary.overdueCount > 0
      ? `Tahsil edilmemiş toplam: ${formatMoney(
          summary.unpaidDebtTotalAmount,
          summary.paymentCurrency
        )}`
      : "Şu anda geciken ödeme görünmüyor"
    : "Aidat sistemi kapalı olduğu için aktif gecikme takibi yok";

  return (
    <OrganizationSectionShell
      organizationId={id}
      org={org}
      me={me}
      members={members}
      canManageOrganization={canManageOrganization}
      subtitle="Organizasyonun temel bilgilerini ve sistem alanlarını burada görüntüleyebilirsin."
    >
      <AppCard>
        {loading ? (
          <div className="mb-4 text-sm text-slate-600">Yükleniyor...</div>
        ) : null}

        {pageError ? (
          <div className="mb-4 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-4">
          <SummaryStatCard
            title="Aktif üye"
            value={activeMemberCount}
            description="Organizasyonda aktif durumda görünen üyeler"
            tone="green"
            href={membersHref}
            meta={`Toplam üye: ${members.length}`}
          />

          <SummaryStatCard
            title="Bekleyen başvuru"
            value={summary.pendingRequestCount}
            description="Henüz sonuçlandırılmamış katılım talepleri"
            tone="yellow"
            href={requestsHref}
            meta={
              summary.pendingRequestCount > 0
                ? "İnceleme bekleyen talepler var"
                : "Bekleyen talep bulunmuyor"
            }
          />

          <SummaryStatCard
            title="Aidat sistemi"
            value={summary.paymentEnabled ? "Açık" : "Kapalı"}
            description="Organizasyon için aidat takibi durumu"
            tone="blue"
            href={paymentsHref}
            meta={paymentMeta}
          />

          <SummaryStatCard
            title="Geciken ödeme"
            value={summary.overdueCount}
            description="Ödeme gecikmesi görünen üye sayısı"
            tone="default"
            href={paymentsHref}
            meta={overdueMeta}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-5 shadow-sm">
            <div className="mb-4">
              <div className="text-sm text-slate-500">
                Temel organizasyon bilgileri
              </div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Genel görünüm
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ReadonlyField label="Organizasyon adı" value={org?.name ?? ""} />
              <ReadonlyField
                label="Vergi numarası"
                value={org?.taxNumber ?? ""}
              />
              <ReadonlyField label="Şehir" value={org?.city ?? ""} />
              <ReadonlyField label="İlçe" value={org?.district ?? ""} />
              <ReadonlyField
                label="Açıklama"
                value={org?.description ?? ""}
                className="sm:col-span-2"
              />
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/20 p-5 shadow-sm">
            <div className="mb-4">
              <div className="text-sm text-slate-500">Hızlı sistem özeti</div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Kısa bilgi
              </div>
            </div>

            <div className="grid gap-4">
              <ReadonlyField
                label="Durum"
                value={org?.isActive ? "Aktif" : "Pasif"}
              />
              <ReadonlyField
                label="Oluşturulma tarihi"
                value={formatUtcDate(org?.createdAtUtc)}
                mono
              />
              <ReadonlyField
                label="Aidat takibi"
                value={summary.paymentEnabled ? "Açık" : "Kapalı"}
              />
              <ReadonlyField
                label="Tahsil edilmemiş toplam"
                value={formatMoney(
                  summary.unpaidDebtTotalAmount,
                  summary.paymentCurrency
                )}
              />
            </div>
          </div>
        </div>
      </AppCard>
    </OrganizationSectionShell>
  );
}