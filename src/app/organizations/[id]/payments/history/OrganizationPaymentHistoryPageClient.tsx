"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import OrganizationSectionShell from "@/components/organization-section-shell";
import { AppButton, AppCard, AppLinkButton, AppSectionHeader } from "@/components/ui";
import { useToast } from "@/components/ToastProvider";
import { useOrganizationPageData } from "@/hooks/use-organization-page-data";
import {
  getOrganizationPaymentHistory,
  type GetOrganizationPaymentHistoryResponseDto,
  type OrganizationPaymentHistoryItemDto,
} from "@/lib/api";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function getStatusBadge(status: string) {
  if (status === "Cancelled") {
    return {
      label: "İptal edildi",
      style: {
        borderColor: "var(--danger-border)",
        backgroundColor: "var(--danger-bg)",
        color: "var(--danger-text)",
      },
    };
  }

  return {
    label: "Tamamlandı",
    style: {
      borderColor: "var(--success-border)",
      backgroundColor: "var(--success-bg)",
      color: "var(--success-text)",
    },
  };
}

function getCancellationReasonLabel(value?: string | null) {
  switch (value) {
    case "WrongAmount":
      return "Yanlış tutar girildi";
    case "WrongMember":
      return "Yanlış üyeye ödeme işlendi";
    case "WrongPeriod":
      return "Yanlış döneme ödeme işlendi";
    case "DuplicatePayment":
      return "Mükerrer ödeme kaydı";
    case "WrongPaymentPlan":
      return "Hatalı aidat planı";
    case "WrongPlanRevision":
      return "Hatalı plan revizyonu";
    case "TestDataCleanup":
      return "Test verisi temizliği";
    case "Other":
      return "Diğer";
    default:
      return "—";
  }
}

function getCancellationTypeLabel(value?: string | null) {
  switch (value) {
    case "BulkRollback":
      return "Toplu geri al";
    case "ManualSingle":
      return "Bireysel iptal";
    default:
      return "—";
  }
}

function HistorySummaryCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle?: string;
}) {
  return (
    <div
      className="rounded-[24px] border p-4 shadow-sm"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      <div className="text-sm" style={{ color: "var(--text-muted)" }}>
        {title}
      </div>
      <div
        className="mt-2 text-[24px] font-semibold tracking-tight"
        style={{ color: "var(--text)" }}
      >
        {value}
      </div>
      {subtitle ? (
        <div className="mt-2 text-xs leading-5" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}

export default function OrganizationPaymentHistoryPageClient({
  organizationId,
}: {
  organizationId: string;
}) {
  const { showToast } = useToast();

  const { org, me, members, canManageOrganization } =
    useOrganizationPageData(organizationId);

  const [isLoading, setIsLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [data, setData] = useState<GetOrganizationPaymentHistoryResponseDto | null>(null);

  const [search, setSearch] = useState("");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "cancelled">("all");
  const [includeCancelled, setIncludeCancelled] = useState(true);
  const [page, setPage] = useState(1);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 7 }, (_, i) => String(currentYear - 2 + i));
  }, []);

  async function loadHistory(nextPage = page) {
    try {
      setIsLoading(true);
      setPageError(null);

      const result = await getOrganizationPaymentHistory(organizationId, {
        search: search.trim() || undefined,
        year: year ? Number(year) : undefined,
        month: month ? Number(month) : undefined,
        day: day ? Number(day) : undefined,
        status: status === "all" ? undefined : status,
        includeCancelled,
        page: nextPage,
        pageSize: 50,
      });

      setData(result);
      setPage(nextPage);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Ödeme geçmişi yüklenemedi.";
      setPageError(message);
      showToast({
        message,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadHistory(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = data?.items ?? [];

  const totalCompletedAmount = items
    .filter((x) => x.status === "Completed")
    .reduce((sum, x) => sum + x.amount, 0);

  const completedCount = items.filter((x) => x.status === "Completed").length;
  const cancelledCount = items.filter((x) => x.status === "Cancelled").length;

  const printableTitle = org?.name
    ? `${org.name} - ödeme geçmişi`
    : "Ödeme geçmişi";

  return (
    <OrganizationSectionShell
      organizationId={organizationId}
      org={org}
      me={me}
      members={members}
      canManageOrganization={canManageOrganization}
      subtitle="Yıl, ay, gün ve durum filtreleriyle ödeme geçmişini detaylı görüntüleyebilirsin."
    >
      <AppCard>
        <AppSectionHeader
          title="Ödeme Geçmişi"
          description="Kim, ne zaman, hangi dönem için, ne kadar ödeme yaptı ya da hangi kayıt iptal edildi; bu ekrandan detaylı takip edebilirsin."
          right={
            <div className="flex flex-wrap gap-2">
              <AppLinkButton href={`/organizations/${organizationId}/payments`}>
                Aidat ekranına dön
              </AppLinkButton>
              <AppButton onClick={() => window.print()}>Yazdır</AppButton>
            </div>
          }
        />

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <HistorySummaryCard
            title="Listelenen kayıt"
            value={String(data?.totalCount ?? 0)}
            subtitle="Filtreye uyan toplam ödeme geçmişi kaydı"
          />
          <HistorySummaryCard
            title="Tamamlanan kayıt"
            value={String(completedCount)}
            subtitle="İptal edilmemiş ödeme kayıtları"
          />
          <HistorySummaryCard
            title="İptal edilen kayıt"
            value={String(cancelledCount)}
            subtitle="İptal durumuna alınmış kayıtlar"
          />
          <HistorySummaryCard
            title="Listelenen tahsilat toplamı"
            value={formatMoney(totalCompletedAmount, "TRY")}
            subtitle="Bu kart şu an listelenen satırların tamamlanan kayıt toplamını gösterir"
          />
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_220px_160px_160px_180px]">
          <label>
            <div className="mb-1 text-sm font-medium text-slate-700">Arama</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="İsim, mail, dönem, not..."
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none"
            />
          </label>

          <label>
            <div className="mb-1 text-sm font-medium text-slate-700">Yıl</div>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none"
            >
              <option value="">Tümü</option>
              {yearOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div className="mb-1 text-sm font-medium text-slate-700">Ay</div>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none"
            >
              <option value="">Tümü</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div className="mb-1 text-sm font-medium text-slate-700">Gün</div>
            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none"
            >
              <option value="">Tümü</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>
                  {i + 1}
                </option>
              ))}
            </select>
          </label>

          <label>
            <div className="mb-1 text-sm font-medium text-slate-700">Durum</div>
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as "all" | "completed" | "cancelled")
              }
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none"
            >
              <option value="all">Tümü</option>
              <option value="completed">Tamamlanan</option>
              <option value="cancelled">İptal edilen</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="inline-flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={includeCancelled}
              onChange={(e) => setIncludeCancelled(e.target.checked)}
            />
            İptal edilen kayıtları da dahil et
          </label>

          <div className="flex flex-wrap gap-2">
            <AppButton
              onClick={() => {
                setSearch("");
                setYear("");
                setMonth("");
                setDay("");
                setStatus("all");
                setIncludeCancelled(true);
                setPage(1);
                setTimeout(() => loadHistory(1), 0);
              }}
            >
              Filtreleri temizle
            </AppButton>
            <AppButton onClick={() => loadHistory(1)} tone="primary">
              Listeyi getir
            </AppButton>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-[24px] border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50">
              <tr className="text-left text-slate-600">
                <th className="px-4 py-3">Üye</th>
                <th className="px-4 py-3">Dönem</th>
                <th className="px-4 py-3">Tutar</th>
                <th className="px-4 py-3">Ödeme tarihi</th>
                <th className="px-4 py-3">İşaretleyen</th>
                <th className="px-4 py-3">Durum</th>
                <th className="px-4 py-3">Detay</th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Yükleniyor...
                  </td>
                </tr>
              ) : pageError ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-red-600">
                    {pageError}
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                    Filtreye uygun ödeme geçmişi kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                items.map((item: OrganizationPaymentHistoryItemDto) => {
                  const badge = getStatusBadge(item.status);

                  return (
                    <tr key={item.paymentId} className="border-t border-slate-200 align-top">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">
                          {item.memberDisplayName || item.memberEmail}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{item.memberEmail}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Rol: {item.role} · {item.isMemberActive ? "Aktif" : "Pasif"}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{item.periodLabel}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {item.periodYear}
                          {item.periodMonth ? ` / ${item.periodMonth}` : ""}
                        </div>
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-900">
                        {formatMoney(item.amount, item.currency)}
                      </td>

                      <td className="px-4 py-4 text-slate-700">
                        {formatDateTime(item.paidAtUtc)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="text-slate-900">{item.markedByDisplayName}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.markedByEmail}</div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className="inline-flex rounded-full border px-2.5 py-1 text-xs font-medium"
                          style={badge.style}
                        >
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <details className="group">
                          <summary className="cursor-pointer list-none text-sm font-medium text-slate-700">
                            Detayı gör
                          </summary>

                          <div className="mt-3 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs leading-6 text-slate-600">
                            <div>Ödeme yöntemi: {item.paymentMethod}</div>
                            <div>Ayar snapshot tutarı: {formatMoney(item.settingsAmountSnapshot, item.currency)}</div>
                            <div>Not: {item.note || "—"}</div>

                            {item.status === "Cancelled" ? (
                              <>
                                <div>İptal tarihi: {formatDateTime(item.cancelledAtUtc)}</div>
                                <div>İptal eden: {item.cancelledByDisplayName || "—"}</div>
                                <div>İptal tipi: {getCancellationTypeLabel(item.cancellationType)}</div>
                                <div>İptal sebebi: {getCancellationReasonLabel(item.cancellationReasonCode)}</div>
                                <div>İptal notu: {item.cancellationNote || "—"}</div>
                              </>
                            ) : null}
                          </div>
                        </details>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-slate-600">
            {printableTitle} · Sayfa {data?.page ?? 1}
            {data?.totalPages ? ` / ${data.totalPages}` : ""}
          </div>

          <div className="flex flex-wrap gap-2">
            <AppButton
              disabled={!data || data.page <= 1 || isLoading}
              onClick={() => loadHistory((data?.page ?? 1) - 1)}
            >
              Önceki
            </AppButton>

            <AppButton
              disabled={
                !data ||
                data.totalPages === 0 ||
                data.page >= data.totalPages ||
                isLoading
              }
              onClick={() => loadHistory((data?.page ?? 1) + 1)}
              tone="primary"
            >
              Sonraki
            </AppButton>
          </div>
        </div>

        <div className="mt-4 text-xs text-slate-500">
          Bu ekran filtrelenmiş ödeme kayıtlarını gösterir. “Yazdır” ile tarayıcı yazdırma akışını kullanabilirsin.
        </div>

        <div className="hidden print:block print:mt-6 print:text-sm print:text-slate-700">
          <div className="font-semibold">{printableTitle}</div>
          <div className="mt-1">Oluşturulma zamanı: {formatDateTime(new Date().toISOString())}</div>
        </div>
      </AppCard>

      <AppCard>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/organizations/${organizationId}/payments`}
            className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            Aidat / ödemeler ekranına dön
          </Link>
        </div>
      </AppCard>
    </OrganizationSectionShell>
  );
}