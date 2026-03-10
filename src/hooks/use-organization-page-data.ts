"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getMe,
  getOrganizationById,
  getOrganizationMembers,
  type MeResponse,
  type OrganizationDto,
  type OrganizationMemberDto,
} from "@/lib/api";

type UseOrganizationPageDataResult = {
  org: OrganizationDto | null;
  me: MeResponse | null;
  members: OrganizationMemberDto[];
  loading: boolean;
  actionLoading: boolean;
  setActionLoading: React.Dispatch<React.SetStateAction<boolean>>;
  canManageOrganization: boolean;
  reload: (options?: { silent?: boolean }) => Promise<void>;
};

export function useOrganizationPageData(
  organizationId: string
): UseOrganizationPageDataResult {
  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const reload = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (!silent) {
        setLoading(true);
      }

      try {
        const [orgData, meData, memberData] = await Promise.all([
          getOrganizationById(organizationId),
          getMe(),
          getOrganizationMembers(organizationId),
        ]);

        setOrg(orgData);
        setMe(meData);
        setMembers(memberData);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [organizationId]
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const canManageOrganization = useMemo(() => {
    if (!org || !me) return false;

    return (
      (me.roles ?? []).includes("SuperAdmin") || me.userId === org.ownerUserId
    );
  }, [me, org]);

  return {
    org,
    me,
    members,
    loading,
    actionLoading,
    setActionLoading,
    canManageOrganization,
    reload,
  };
}