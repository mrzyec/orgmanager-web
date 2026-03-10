"use client";

import { useEffect, useMemo, useState } from "react";
import OrganizationSectionShell from "@/components/organization-section-shell";
import {
  PendingRequestsSection,
  ReviewedRequestsSection,
} from "@/components/organization-requests-section";
import {
  getMe,
  getOrganizationById,
  getOrganizationJoinRequests,
  getOrganizationMembers,
  reviewOrganizationJoinRequest,
  setOrganizationActive,
  type MeResponse,
  type OrganizationDto,
  type OrganizationJoinRequestDto,
  type OrganizationMemberDto,
} from "@/lib/api";
import { useToast } from "@/components/ToastProvider";

export default function OrganizationRequestsPageClient({ id }: { id: string }) {
  const { showToast } = useToast();

  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
  const [requests, setRequests] = useState<OrganizationJoinRequestDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  async function loadData(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    if (!silent) setLoading(true);

    try {
      const [orgData, meData, memberData, requestData] = await Promise.all([
        getOrganizationById(id),
        getMe(),
        getOrganizationMembers(id),
        getOrganizationJoinRequests(id),
      ]);

      setOrg(orgData);
      setMe(meData);
      setMembers(memberData);
      setRequests(requestData);
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

  async function handleReviewJoinRequest(requestId: string, approve: boolean) {
    setActionLoading(true);

    try {
      await reviewOrganizationJoinRequest(requestId, approve);
      await loadData({ silent: true });

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
        loading={loading}
        actionLoading={actionLoading}
        onReview={handleReviewJoinRequest}
      />

      <ReviewedRequestsSection
        requests={reviewedJoinRequests}
        loading={loading}
      />
    </OrganizationSectionShell>
  );
}