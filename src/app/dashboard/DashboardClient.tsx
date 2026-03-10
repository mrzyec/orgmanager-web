"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import OrgsCard from "@/components/OrgsCard";
import {
  getAccessToken,
  getMe,
  getMyOrganizationJoinRequests,
  getOrganizations,
  logout,
  type MeResponse,
  type OrganizationDto,
  type OrganizationJoinRequestDto,
} from "@/lib/api";
import { AppCard, AppPage } from "@/components/ui";
import { JoinRequestSummaryCard } from "@/components/join-ui";
import {
  AppNavbar,
  AppNavbarDashboardActions,
} from "@/components/app-navbar";

function SummaryStat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "green" | "slate";
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60"
      : tone === "slate"
      ? "border-slate-200 bg-gradient-to-br from-slate-100 via-white to-slate-50"
      : "border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/30";

  return (
    <div className={`rounded-[28px] border p-5 shadow-sm ${toneClass}`}>
      <div className="text-sm font-medium text-slate-600">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </div>
      {hint ? <div className="mt-2 text-xs text-slate-500">{hint}</div> : null}
    </div>
  );
}

export default function DashboardClient() {
  const router = useRouter();

  const [me, setMe] = useState<MeResponse | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationDto[]>([]);
  const [joinRequests, setJoinRequests] = useState<OrganizationJoinRequestDto[]>(
    []
  );

  const [loading, setLoading] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const token = getAccessToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        const [meData, organizationsData, joinRequestsData] = await Promise.all([
          getMe(),
          getOrganizations(),
          getMyOrganizationJoinRequests(),
        ]);

        if (!cancelled) {
          setMe(meData);
          setOrganizations(organizationsData);
          setJoinRequests(joinRequestsData);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Veriler yüklenemedi.";
          setError(message);
          router.replace("/login");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleLogout() {
    setLogoutLoading(true);

    try {
      await logout();
      router.replace("/login");
    } catch {
      router.replace("/login");
    } finally {
      setLogoutLoading(false);
    }
  }

  const activeCount = useMemo(
    () => organizations.filter((x) => x.isActive).length,
    [organizations]
  );

  const passiveCount = useMemo(
    () => organizations.filter((x) => !x.isActive).length,
    [organizations]
  );

  const pendingJoinRequestCount = useMemo(
    () => joinRequests.filter((x) => x.status === "Pending").length,
    [joinRequests]
  );

  if (loading) {
    return (
      <AppPage>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          Dashboard yükleniyor...
        </div>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <AppNavbar
        email={me?.email}
        title="Dashboard"
        subtitle="Organizasyonlarını, başvurularını ve genel durumunu buradan takip edebilirsin."
        actions={
          <AppNavbarDashboardActions
            onLogout={handleLogout}
            logoutLoading={logoutLoading}
          />
        }
      />

      <AppCard>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <SummaryStat
            label="Toplam organizasyon"
            value={String(organizations.length)}
            hint="Dahil olduğun toplam organizasyon sayısı"
          />
          <SummaryStat
            label="Aktif organizasyon"
            value={String(activeCount)}
            hint="Şu an aktif durumda olan organizasyonlar"
            tone="green"
          />
          <SummaryStat
            label="Pasif organizasyon"
            value={String(passiveCount)}
            hint="Pasif durumda görünen organizasyonlar"
            tone="slate"
          />
          <SummaryStat
            label="Bekleyen başvuru"
            value={String(pendingJoinRequestCount)}
            hint="Sonuç bekleyen katılım taleplerin"
          />
        </div>
      </AppCard>

      {error ? (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <JoinRequestSummaryCard requests={joinRequests} />
      <OrgsCard organizations={organizations} />
    </AppPage>
  );
}