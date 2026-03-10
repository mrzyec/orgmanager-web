"use client";

import OrganizationSectionShell from "@/components/organization-section-shell";
import OrganizationPaymentsSection from "@/components/organization-payments-section";
import { setOrganizationActive } from "@/lib/api";
import { useOrganizationPageData } from "@/hooks/use-organization-page-data";

export default function OrganizationPaymentsPageClient({ id }: { id: string }) {
  const {
    org,
    me,
    members,
    actionLoading,
    setActionLoading,
    canManageOrganization,
    reload,
  } = useOrganizationPageData(id);

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
      await reload({ silent: true });
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