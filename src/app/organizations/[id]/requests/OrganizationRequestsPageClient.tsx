"use client";

import { useEffect, useMemo, useState } from "react";
import OrganizationSectionShell from "@/components/organization-section-shell";
import {
  PendingRequestsSection,
  ReviewedRequestsSection,
} from "@/components/organization-requests-section";
import {
  getOrganizationJoinRequests,
  reviewOrganizationJoinRequest,
  setOrganizationActive,
  type OrganizationJoinRequestDto,
} from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import { useOrganizationPageData } from "@/hooks/use-organization-page-data";

export default function OrganizationRequestsPageClient({ id }: { id: string }) {
  const { showToast } = useToast();

  const {
    org,
    me,
    members,
    loading: shellLoading,
    actionLoading,
    setActionLoading,
    canManageOrganization,
    reload,
  } = useOrganizationPageData(id);

  const [requests, setRequests] = useState<OrganizationJoinRequestDto[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadRequests(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;

    if (!silent) {
      setLoading(true);
    }

    try {
      const data = await getOrganizationJoinRequests(id);
      setRequests(data);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    loadRequests();
  }, [id]);

  const pendingJoinRequests = useMemo(
    () => requests.filter((x) => x.status === "Pending"),
    [requests]
  );

  const reviewedJoinRequests = useMemo(
    () => requests.filter((x) => x.status !== "Pending"),
    [requests]
  );

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
      await reload({ silent: true, force: true });
      showToast({
        message: targetIsActive
          ? "Organizasyon başarıyla aktif hale getirildi."
          : "Organizasyon başarıyla pasif hale getirildi.",
        type: "success",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReviewJoinRequest(requestId: string, approve: boolean) {
    setActionLoading(true);

    try {
      await reviewOrganizationJoinRequest(requestId, approve);
      await loadRequests({ silent: true });

      showToast({
        message: approve ? "Katılım talebi onaylandı." : "Katılım talebi reddedildi.",
        type: "success",
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
      subtitle="Bekleyen ve sonuçlanmış katılım taleplerini bu sayfadan yönetebilirsin."
    >
      <PendingRequestsSection
        requests={pendingJoinRequests}
        loading={shellLoading || loading}
        actionLoading={actionLoading}
        onReview={handleReviewJoinRequest}
      />

      <ReviewedRequestsSection
        requests={reviewedJoinRequests}
        loading={shellLoading || loading}
      />
    </OrganizationSectionShell>
  );
}