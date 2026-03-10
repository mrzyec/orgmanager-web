"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { AppButton, AppCard } from "@/components/ui";
import { ReadonlyField } from "@/components/detail-ui";
import OrganizationSectionShell from "@/components/organization-section-shell";
import {
  getMe,
  getOrganizationById,
  getOrganizationMembers,
  regenerateOrganizationJoinCode,
  setOrganizationActive,
  type MeResponse,
  type OrganizationDto,
  type OrganizationMemberDto,
} from "@/lib/api";

function formatUtcDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function OrganizationSettingsPageClient({ id }: { id: string }) {
  const { showToast } = useToast();

  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadData(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    if (!silent) setLoading(true);

    try {
      const [orgData, meData, memberData] = await Promise.all([
        getOrganizationById(id),
        getMe(),
        getOrganizationMembers(id),
      ]);

      setOrg(orgData);
      setMe(meData);
      setMembers(memberData);
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const canManageOrganization = useMemo(() => {
    if (!org || !me) return false;
    return (me.roles ?? []).includes("SuperAdmin") || me.userId === org.ownerUserId;
  }, [me, org]);

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
    try {
      await setOrganizationActive(org.id, targetIsActive);
      await loadData({ silent: true });

      showToast({
        message: targetIsActive
          ? "Organizasyon başarıyla aktif hale getirildi."
          : "Organizasyon başarıyla pasif hale getirildi.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Organizasyon durumu güncellenemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCopyJoinCode() {
    if (!org?.joinCode) return;

    try {
      await navigator.clipboard.writeText(org.joinCode);
      showToast({
        message: "Katılım kodu panoya kopyalandı.",
        type: "success",
      });
    } catch {
      showToast({
        message: "Katılım kodu kopyalanamadı.",
        type: "error",
      });
    }
  }

  async function handleRegenerateJoinCode() {
    if (!org?.id) return;

    setActionLoading(true);
    try {
      const updated = await regenerateOrganizationJoinCode(org.id);
      setOrg(updated);

      showToast({
        message: "Katılım kodu başarıyla yenilendi.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Katılım kodu yenilenemedi.",
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
      subtitle="Organizasyonun join code ve operasyonel ayarlarını bu sayfadan yönetebilirsin."
    >
      <AppCard>
        {loading ? <div className="mb-4 text-sm text-slate-600">Yükleniyor...</div> : null}

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-amber-50/20 p-5 shadow-sm">
            <div className="mb-4">
              <div className="text-sm text-slate-500">Katılım ayarları</div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Join code yönetimi
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Organizasyona katılım için kullanılan kodu buradan görüntüleyebilir, kopyalayabilir veya yenileyebilirsin.
              </p>
            </div>

            <div className="grid gap-4">
              <ReadonlyField
                label="Geçerli join code"
                value={org?.joinCode ?? ""}
                mono
              />
              <ReadonlyField
                label="Organizasyon durumu"
                value={org?.isActive ? "Aktif" : "Pasif"}
              />
              <ReadonlyField
                label="Oluşturulma tarihi"
                value={formatUtcDate(org?.createdAtUtc)}
                mono
              />
            </div>

            {canManageOrganization ? (
              <div className="mt-5 flex flex-wrap gap-2">
                <AppButton onClick={handleCopyJoinCode}>
                  Kodu kopyala
                </AppButton>

                <AppButton
                  onClick={handleRegenerateJoinCode}
                  disabled={actionLoading}
                >
                  {actionLoading ? "İşleniyor..." : "Yeni kod üret"}
                </AppButton>
              </div>
            ) : null}
          </div>

          <div className="rounded-[28px] border border-red-200 bg-gradient-to-r from-red-50 via-white to-red-50/40 p-5 shadow-sm">
            <div className="mb-4">
              <div className="text-sm text-red-600">Tehlikeli işlemler</div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Organizasyon durumu
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Organizasyonu aktif veya pasif hale getirme işlemleri dikkatli kullanılmalıdır.
              </p>
            </div>

            <div className="rounded-3xl border border-red-200 bg-white/90 p-4 text-sm leading-6 text-slate-700">
              Pasif durumda organizasyon görünürlüğü ve bazı akışlar etkilenebilir.
              Bu işlemi yapmadan önce emin olman gerekir.
            </div>

            {canManageOrganization ? (
              <div className="mt-5">
                <AppButton onClick={handleToggleActive} disabled={actionLoading}>
                  {actionLoading
                    ? "Güncelleniyor..."
                    : org?.isActive
                    ? "Organizasyonu pasife al"
                    : "Organizasyonu aktif et"}
                </AppButton>
              </div>
            ) : null}
          </div>
        </div>
      </AppCard>
    </OrganizationSectionShell>
  );
}