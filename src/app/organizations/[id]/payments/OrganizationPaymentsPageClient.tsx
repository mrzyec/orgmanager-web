"use client";

import { useEffect, useMemo, useState } from "react";
import OrganizationSectionShell from "@/components/organization-section-shell";
import OrganizationPaymentsSection from "@/components/organization-payments-section";
import {
  getMe,
  getOrganizationById,
  getOrganizationMembers,
  setOrganizationActive,
  type MeResponse,
  type OrganizationDto,
  type OrganizationMemberDto,
} from "@/lib/api";

export default function OrganizationPaymentsPageClient({ id }: { id: string }) {
  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadData(options?: { silent?: boolean }) {
    const [orgData, meData, memberData] = await Promise.all([
      getOrganizationById(id),
      getMe(),
      getOrganizationMembers(id),
    ]);

    setOrg(orgData);
    setMe(meData);
    setMembers(memberData);
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const canManageOrganization = useMemo(() => {
    if (!org || !me) return false;
    return (me.roles ?? []).includes("SuperAdmin") || me.userId === org.ownerUserId;
  }, [me, org]);

  const canManagePayments = canManageOrganization;

  async function handleToggleActive() {
    if (!org?.id || typeof org.isActive !== "boolean") return;

    const confirmed = window.confirm(
      !org.isActive
        ? "Bu organizasyonu aktif hale getirmek istiyor musun?"
        : "Bu organizasyonu pasif hale getirmek istiyor musun?"
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await setOrganizationActive(org.id, !org.isActive);
      await loadData({ silent: true });
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
      subtitle="Aidat ayarlarını ve üye ödeme durumlarını bu sayfadan yönetebilirsin."
    >
      <OrganizationPaymentsSection
        organizationId={id}
        canManagePayments={canManagePayments}
      />
    </OrganizationSectionShell>
  );
}