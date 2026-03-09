"use client";

import Link from "next/link";
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
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Başvuru durumu
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Katılım kodu ile gönderdiğin başvuruların kısa özeti.
          </p>
        </div>

        <Link
          href="/join"
          className="rounded-xl border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-800 transition hover:bg-gray-50 hover:shadow-sm active:translate-y-[1px] active:scale-[0.98]"
        >
          Başvurularımı aç
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="text-sm text-amber-700">Bekleyen</div>
          <div className="mt-1 text-2xl font-semibold text-amber-800">
            {pendingCount}
          </div>
        </div>

        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <div className="text-sm text-green-700">Onaylanan</div>
          <div className="mt-1 text-2xl font-semibold text-green-800">
            {approvedCount}
          </div>
        </div>

        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="text-sm text-red-700">Reddedilen</div>
          <div className="mt-1 text-2xl font-semibold text-red-800">
            {rejectedCount}
          </div>
        </div>
      </div>

      {latestPending ? (
        <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="text-sm font-medium text-amber-900">
            Bekleyen son başvuru
          </div>
          <div className="mt-1 text-sm text-amber-800">
            {latestPending.organizationName}
          </div>
          <div className="mt-1 text-xs text-amber-700">
            Oluşturulma: {latestPending.createdAtUtc}
          </div>
        </div>
      ) : (
        <div className="mt-5 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
          Bekleyen bir başvurun bulunmuyor.
        </div>
      )}
    </section>
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
      <div className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-5xl text-sm text-gray-600">
          Dashboard yükleniyor...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
              <p className="mt-1 text-sm text-gray-600">
                Hoş geldin{me?.email ? `, ${me.email}` : ""}.
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/join"
                className="rounded-xl border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-800 transition hover:bg-gray-50 hover:shadow-sm active:translate-y-[1px] active:scale-[0.98]"
              >
                Katılım kodu ile başvur
              </Link>

              <Link
                href="/organizations/new"
                className="rounded-xl bg-black px-4 py-2 text-center text-sm font-medium text-white transition hover:opacity-90 hover:shadow-sm active:translate-y-[1px] active:scale-[0.98]"
              >
                Yeni organizasyon
              </Link>

              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50 hover:shadow-sm active:translate-y-[1px] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {logoutLoading ? "Çıkış yapılıyor..." : "Çıkış yap"}
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <div className="text-sm text-gray-600">Toplam organizasyon</div>
              <div className="mt-1 text-2xl font-semibold text-gray-900">
                {organizations.length}
              </div>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="text-sm text-green-700">Aktif</div>
              <div className="mt-1 text-2xl font-semibold text-green-800">
                {activeCount}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-100 p-4">
              <div className="text-sm text-gray-700">Pasif</div>
              <div className="mt-1 text-2xl font-semibold text-gray-800">
                {passiveCount}
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <JoinRequestSummaryCard requests={joinRequests} />

        <OrgsCard organizations={organizations} />
      </div>
    </div>
  );
}