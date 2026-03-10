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

type OrganizationPageCacheEntry = {
  org: OrganizationDto | null;
  me: MeResponse | null;
  members: OrganizationMemberDto[];
  fetchedAt: number;
};

type UseOrganizationPageDataResult = {
  org: OrganizationDto | null;
  me: MeResponse | null;
  members: OrganizationMemberDto[];
  loading: boolean;
  actionLoading: boolean;
  setActionLoading: React.Dispatch<React.SetStateAction<boolean>>;
  canManageOrganization: boolean;
  reload: (options?: { silent?: boolean; force?: boolean }) => Promise<void>;
};

const CACHE_TTL_MS = 30_000;

const organizationPageCache = new Map<string, OrganizationPageCacheEntry>();
const inFlightRequests = new Map<string, Promise<OrganizationPageCacheEntry>>();

function getCacheKey(organizationId: string) {
  return `organization-page:${organizationId}`;
}

function isCacheFresh(entry?: OrganizationPageCacheEntry) {
  if (!entry) return false;
  return Date.now() - entry.fetchedAt < CACHE_TTL_MS;
}

async function fetchOrganizationPageData(
  organizationId: string
): Promise<OrganizationPageCacheEntry> {
  const [org, me, members] = await Promise.all([
    getOrganizationById(organizationId),
    getMe(),
    getOrganizationMembers(organizationId),
  ]);

  return {
    org,
    me,
    members,
    fetchedAt: Date.now(),
  };
}

async function getOrCreateRequest(
  organizationId: string
): Promise<OrganizationPageCacheEntry> {
  const cacheKey = getCacheKey(organizationId);
  const existingRequest = inFlightRequests.get(cacheKey);

  if (existingRequest) {
    return existingRequest;
  }

  const request = fetchOrganizationPageData(organizationId)
    .then((data) => {
      organizationPageCache.set(cacheKey, data);
      return data;
    })
    .finally(() => {
      inFlightRequests.delete(cacheKey);
    });

  inFlightRequests.set(cacheKey, request);

  return request;
}

export function useOrganizationPageData(
  organizationId: string
): UseOrganizationPageDataResult {
  const cacheKey = useMemo(() => getCacheKey(organizationId), [organizationId]);

  const initialCache =
    typeof window !== "undefined" ? organizationPageCache.get(cacheKey) : undefined;

  const [org, setOrg] = useState<OrganizationDto | null>(initialCache?.org ?? null);
  const [me, setMe] = useState<MeResponse | null>(initialCache?.me ?? null);
  const [members, setMembers] = useState<OrganizationMemberDto[]>(
    initialCache?.members ?? []
  );
  const [loading, setLoading] = useState(!initialCache);
  const [actionLoading, setActionLoading] = useState(false);

  const applyData = useCallback((data: OrganizationPageCacheEntry) => {
    setOrg(data.org);
    setMe(data.me);
    setMembers(data.members);
  }, []);

  const reload = useCallback(
    async (options?: { silent?: boolean; force?: boolean }) => {
      const silent = options?.silent ?? false;
      const force = options?.force ?? false;

      const cached = organizationPageCache.get(cacheKey);
      const freshCache = !force && isCacheFresh(cached) ? cached : undefined;

      if (freshCache) {
        applyData(freshCache);

        if (!silent) {
          setLoading(false);
        }

        return;
      }

      if (!silent && !cached) {
        setLoading(true);
      }

      try {
        const data = await getOrCreateRequest(organizationId);
        applyData(data);
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [applyData, cacheKey, organizationId]
  );

  useEffect(() => {
    const cached = organizationPageCache.get(cacheKey);

    if (cached) {
      applyData(cached);
      setLoading(false);

      if (!isCacheFresh(cached)) {
        void reload({ silent: true, force: true });
      }

      return;
    }

    void reload();
  }, [applyData, cacheKey, reload]);

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