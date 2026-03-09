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
import {
  AppButton,
  AppCard,
  AppHero,
  AppLinkButton,
  AppPage,
} from "@/components/ui";

function formatUtcDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function JoinRequestSummaryCard({
  requests,
}: {
  requests: OrganizationJoinRequestDto[];
}) {
  const pendingCount = requests.filter((x) => x.status === "Pending").length;
  const approvedCount = requests.filter((x) => x.status === "Approved").length;
  const rejectedCount = requests.filter((x) => x.status === "Rejected").length;

  const latestPending = requests.find((x) => x.status === "Pending");

  return (
    <AppCard>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Başvuru durumu
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Katılım kodu ile gönderdiğin başvuruların kısa özeti.
          </p>
        </div>

        <AppLinkButton href="/join">Başvurularımı aç</AppLinkButton>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-br from-amber-50 to-white p-5">
          <div className="text-sm text-amber-700">Bekleyen</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-amber-800">
            {pendingCount}
          </div>
        </div>

        <div className="rounded-3xl border border-green-200/80 bg-gradient-to-br from-green-50 to-white p-5">
          <div className="text-sm text-green-700">Onaylanan</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-green-800">
            {approvedCount}
          </div>
        </div>

        <div className="rounded-3xl border border-red-200/80 bg-gradient-to-br from-red-50 to-white p-5">
          <div className="text-sm text-red-700">Reddedilen</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-red-800">
            {rejectedCount}
          </div>
        </div>
      </div>

      {latestPending ? (
        <div className="mt-5 rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-white p-5">
          <div className="text-sm font-medium text-amber-900">
            Bekleyen son başvuru
          </div>
          <div className="mt-1 text-base font-medium text-amber-800">
            {latestPending.organizationName}
          </div>
          <div className="mt-1 text-xs text-amber-700">
            Oluşturulma: {formatUtcDate(latestPending.createdAtUtc)}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-3xl border border-dashed border-gray-300 bg-gray-50/70 p-5 text-sm text-gray-600">
          Bekleyen bir başvurun bulunmuyor.
        </div>
      )}
    </AppCard>
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

  if (loading) {
    return (
      <AppPage>
        <div className="text-sm text-gray-600">Dashboard yükleniyor...</div>
      </AppPage>
    );
  }

  return (
    <AppPage>
      <AppCard>
        <div className="flex flex-col gap-5">
          <AppHero
            badge="OrgManager"
            title="Dashboard"
            description={`Hoş geldin${me?.email ? `, ${me.email}` : ""}.`}
            right={
              <div className="flex flex-col gap-2 sm:flex-row">
                <AppLinkButton href="/join">Katılım kodu ile başvur</AppLinkButton>
                <AppLinkButton href="/organizations/new" tone="primary">
                  Yeni organizasyon
                </AppLinkButton>
                <AppButton onClick={handleLogout} disabled={logoutLoading}>
                  {logoutLoading ? "Çıkış yapılıyor..." : "Çıkış yap"}
                </AppButton>
              </div>
            }
          />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5">
              <div className="text-sm text-gray-600">Toplam organizasyon</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
                {organizations.length}
              </div>
            </div>

            <div className="rounded-3xl border border-green-200/80 bg-gradient-to-br from-green-50 to-white p-5">
              <div className="text-sm text-green-700">Aktif</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-green-800">
                {activeCount}
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-100 to-white p-5">
              <div className="text-sm text-gray-700">Pasif</div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-gray-800">
                {passiveCount}
              </div>
            </div>
          </div>
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