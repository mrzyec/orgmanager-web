"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  me,
  logout,
  refreshManually,
  getOrganizations,
  createOrganization,
  setOrganizationActive,
  type OrganizationDto,
  type MeDto,
} from "@/lib/api";

import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
} from "@/lib/authStore";

/**
 * Dashboard:
 * - Token yoksa /login'e yönlendirir (route guard)
 * - /me gösterir
 * - Organizations listele / ekle / aktif-pasif yapar
 * - Detaya gitmek için /organizations/[id] linki verir
 */

export default function DashboardPage() {
  const router = useRouter();

  // Token state (UI göstermek için)
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(
    null
  );

  const isAuthed = useMemo(() => !!accessToken, [accessToken]);

  // /me sonucu
  const [meInfo, setMeInfo] = useState<MeDto | null>(null);

  // Organizations state
  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [orgName, setOrgName] = useState("Org From UI");
  const [orgTax, setOrgTax] = useState(
    "tn-" + Math.floor(Math.random() * 1000000)
  );
  const [orgCity, setOrgCity] = useState("Istanbul");
  const [orgDistrict, setOrgDistrict] = useState("Kadikoy");

  // Hata gösterimi
  const [error, setError] = useState<string | null>(null);

  // ✅ Guard + tokenları localStorage'dan çek
  useEffect(() => {
    const a = getAccessToken();
    const r = getRefreshToken();

    // token yoksa login'e dön
    if (!a) {
      router.replace("/login");
      return;
    }

    setAccessToken(a);
    setRefreshTokenValue(r);
  }, [router]);

  async function safe(fn: () => Promise<void>) {
    try {
      setError(null);
      await fn();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    }
  }

  async function loadMe() {
    const a = getAccessToken();
    if (!a) {
      setMeInfo(null);
      router.replace("/login");
      return;
    }

    const info = await me(); // api.ts Authorization'ı otomatik ekliyor
    setMeInfo(info);
  }

  async function loadOrganizations() {
    const a = getAccessToken();
    if (!a) {
      router.replace("/login");
      return;
    }

    const list = await getOrganizations();
    setOrgs(list);
  }

  async function onRefresh() {
    const rt = refreshTokenValue ?? getRefreshToken();
    if (!rt) return;

    const r = await refreshManually(); // saveTokens içeride yapılıyor
    setAccessToken(r.accessToken);
    setRefreshTokenValue(r.refreshToken);

    await loadMe();
  }

  async function onLogout() {
    const rt = refreshTokenValue ?? getRefreshToken();
    if (rt) {
      await logout(rt);
    }

    clearTokens();
    setAccessToken(null);
    setRefreshTokenValue(null);
    setMeInfo(null);
    setOrgs([]);

    router.replace("/login");
  }

  async function onCreateOrg() {
    const a = getAccessToken();
    if (!a) {
      router.replace("/login");
      return;
    }

    const created = await createOrganization({
      name: orgName,
      taxNumber: orgTax,
      city: orgCity,
      district: orgDistrict,
    });

    setOrgs((prev) => [created, ...prev]);
    setOrgTax("tn-" + Math.floor(Math.random() * 1000000));
  }

  async function onToggleActive(id: string, current: boolean) {
    const a = getAccessToken();
    if (!a) {
      router.replace("/login");
      return;
    }

    await setOrganizationActive(id, !current);
    setOrgs((prev) =>
      prev.map((x) => (x.id === id ? { ...x, isActive: !current } : x))
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Dashboard</h1>

          <button
            className="rounded-md border px-3 py-2 hover:bg-gray-50"
            onClick={() => safe(onLogout)}
          >
            Logout
          </button>
        </div>

        <section className="rounded-xl border p-4 space-y-3">
          <h2 className="text-lg font-medium">Auth Status</h2>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md border px-3 py-2 hover:bg-gray-50"
              onClick={() => safe(loadMe)}
              disabled={!isAuthed}
            >
              /me
            </button>

            <button
              className="rounded-md border px-3 py-2 hover:bg-gray-50"
              onClick={() => safe(onRefresh)}
              disabled={!refreshTokenValue}
              title="Normalde api.ts 401 görünce otomatik refresh dener. Bu buton manuel."
            >
              Refresh (Rotate)
            </button>
          </div>

          <div className="text-sm">
            <div>
              <b>AccessToken:</b> {accessToken ? "var ✅" : "yok ❌"}
            </div>
            <div>
              <b>RefreshToken:</b> {refreshTokenValue ? "var ✅" : "yok ❌"}
            </div>
          </div>

          <div className="rounded-md bg-gray-50 p-3 text-sm">
            <div className="font-medium">Me</div>
            {meInfo ? (
              <pre className="overflow-auto">{JSON.stringify(meInfo, null, 2)}</pre>
            ) : (
              <div className="text-gray-600">Henüz yüklenmedi.</div>
            )}
          </div>
        </section>

        <section className="rounded-xl border p-4 space-y-3">
          <h2 className="text-lg font-medium">Organizations</h2>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md border px-3 py-2 hover:bg-gray-50"
              onClick={() => safe(loadOrganizations)}
              disabled={!isAuthed}
            >
              Listele
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <div className="text-sm text-gray-600">Name</div>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-gray-600">Tax Number</div>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={orgTax}
                onChange={(e) => setOrgTax(e.target.value)}
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-gray-600">City</div>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={orgCity}
                onChange={(e) => setOrgCity(e.target.value)}
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-gray-600">District</div>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={orgDistrict}
                onChange={(e) => setOrgDistrict(e.target.value)}
              />
            </label>
          </div>

          <button
            className="rounded-md border px-3 py-2 hover:bg-gray-50"
            onClick={() => safe(onCreateOrg)}
            disabled={!isAuthed}
          >
            Create Organization
          </button>

          <div className="space-y-2">
            {orgs.length === 0 ? (
              <div className="text-sm text-gray-600">Liste boş.</div>
            ) : (
              orgs.map((o) => (
                <div key={o.id} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="font-medium">{o.name}</div>
                      <div className="text-sm text-gray-600">
                        {o.city} / {o.district} — tax: {o.taxNumber}
                      </div>
                      <div className="text-sm">
                        Active: <b>{String(o.isActive)}</b>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <Link
                          className="rounded-md border px-3 py-2 hover:bg-gray-50"
                          href={`/organizations/${o.id}`}
                          title="Detay sayfasına git"
                        >
                          Details
                        </Link>

                        <button
                          className="rounded-md border px-3 py-2 hover:bg-gray-50"
                          onClick={() =>
                            safe(() => onToggleActive(o.id, o.isActive))
                          }
                          disabled={!isAuthed}
                        >
                          Toggle Active
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-gray-500 font-mono">
                      {o.id}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {error && (
          <section className="rounded-xl border border-red-300 bg-red-50 p-4">
            <div className="font-medium text-red-700">Hata</div>
            <pre className="mt-2 overflow-auto text-sm text-red-700">{error}</pre>
          </section>
        )}
      </div>
    </main>
  );
}