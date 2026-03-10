"use client";

import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { AppCard } from "@/components/ui";
import { ReadonlyField } from "@/components/detail-ui";
import OrganizationSectionShell from "@/components/organization-section-shell";
import { setOrganizationActive } from "@/lib/api";
import { useOrganizationPageData } from "@/hooks/use-organization-page-data";

function formatUtcDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function OrganizationOverviewClient({ id }: { id: string }) {
  const { showToast } = useToast();
  const [pageError, setPageError] = useState<string | null>(null);

  const {
    org,
    me,
    members,
    loading,
    actionLoading,
    setActionLoading,
    canManageOrganization,
    reload,
  } = useOrganizationPageData(id);

  async function handleToggleActive() {
    if (!org?.id || typeof org.isActive !== "boolean") return;

    const targetIsActive = !org.isActive;
    const confirmed = window.confirm(
      targetIsActive
        ? "Bu organizasyonu aktif hale getirmek istiyor musun?"
        : "Bu organizasyonu pasif hale getirmek istiyor musun?"
    );

    if (!confirmed) return;

    setActionLoading(true);
    setPageError(null);

    try {
      await setOrganizationActive(org.id, targetIsActive);

      showToast({
        message: targetIsActive
          ? "Organizasyon başarıyla aktif hale getirildi."
          : "Organizasyon başarıyla pasif hale getirildi.",
        type: "success",
      });

      await reload({ silent: true });
    } catch (e: any) {
      setPageError(e?.message ?? "Organizasyon durumu güncellenemedi.");
      showToast({
        message: e?.message ?? "Organizasyon durumu güncellenemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <OrganizationSectionShell
      organizationId={id}
      org={org}
      me={me}
      members={members}
      canManageOrganization={canManageOrganization}
      actionLoading={actionLoading}
      onToggleActive={handleToggleActive}
      subtitle="Organizasyonun temel bilgilerini ve sistem alanlarını burada görüntüleyebilirsin."
    >
      <AppCard>
        {loading ? <div className="mb-4 text-sm text-slate-600">Yükleniyor...</div> : null}

        {pageError ? (
          <div className="mb-4 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-5 shadow-sm xl:col-span-2">
            <div className="mb-4">
              <div className="text-sm text-slate-500">Temel organizasyon bilgileri</div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Genel görünüm
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <ReadonlyField label="Organizasyon adı" value={org?.name ?? ""} />
              <ReadonlyField label="Vergi numarası" value={org?.taxNumber ?? ""} />
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
              <div className="text-sm text-slate-500">Sistem ve erişim bilgileri</div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Teknik alan
              </div>
            </div>

            <div className="grid gap-4">
              <ReadonlyField label="Organization Id" value={id ?? ""} mono />
              {canManageOrganization ? (
                <ReadonlyField
                  label="Owner kullanıcı id"
                  value={org?.ownerUserId ?? ""}
                  mono
                />
              ) : null}
              <ReadonlyField
                label="Oluşturulma tarihi"
                value={formatUtcDate(org?.createdAtUtc)}
                mono
              />
              <ReadonlyField
                label="Durum"
                value={org?.isActive ? "Aktif" : "Pasif"}
              />
            </div>
          </div>
        </div>
      </AppCard>
    </OrganizationSectionShell>
  );
}