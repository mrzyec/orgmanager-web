"use client";

/**
 * Bu sayfa bir "DEV PANEL" gibi çalışıyor.
 *
 * Amaç:
 * 1) Register/Login ile access + refresh token al
 * 2) Tokenları localStorage'a kaydet
 * 3) /me endpointi ile token çalışıyor mu doğrula
 * 4) Organizations listele/ekle
 * 5) Toggle Active ile aktif/pasif test et
 *
 * Öğrenme notu:
 * - UI sadece "hangi API fonksiyonunu çağıracağını" bilir
 * - fetch/URL/headers/hata parse işi lib/apiClient.ts içinde
 */

import { useEffect, useMemo, useState } from "react";
import { login, me, register, logout, refresh } from "@/lib/authApi";
import {
  createOrganization,
  getOrganizations,
  setOrganizationActive,
  type OrganizationDto,
} from "@/lib/orgApi";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/lib/authStore";

export default function HomePage() {
  // ----------- Auth form state -----------
  const [email, setEmail] = useState("finaltest@orgmanager.local");
  const [password, setPassword] = useState("a12345");

  // ----------- Token state -----------
  // Not: Bunlar localStorage'dan da okunabilir ama UI'de göstermek için state'te tutuyoruz.
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshTokenValue, setRefreshTokenValue] = useState<string | null>(null);

  // /me sonucu
  const [meInfo, setMeInfo] = useState<{ userId: string; email: string; userName: string } | null>(null);

  // Organizations state
  const [orgs, setOrgs] = useState<OrganizationDto[]>([]);
  const [orgName, setOrgName] = useState("Org From UI");
  const [orgTax, setOrgTax] = useState("tn-" + Math.floor(Math.random() * 1000000));
  const [orgCity, setOrgCity] = useState("Istanbul");
  const [orgDistrict, setOrgDistrict] = useState("Kadikoy");

  // Basit hata gösterimi
  const [error, setError] = useState<string | null>(null);

  // Token varsa "yetkili" say
  const isAuthed = useMemo(() => !!accessToken, [accessToken]);

  // Sayfa açılınca localStorage -> state
  useEffect(() => {
    const a = getAccessToken();
    const r = getRefreshToken();
    setAccessToken(a);
    setRefreshTokenValue(r);
  }, []);

  /**
   * helper: her async aksiyonda hata yakalayıp ekranda göstermek için
   */
  async function safe(fn: () => Promise<void>) {
    try {
      setError(null);
      await fn();
    } catch (e: any) {
      // HttpError.message genellikle yeterli (apiClient bunu güzel üretiyor)
      setError(e?.message ?? "Unknown error");
    }
  }

  /**
   * /me çağır: access token valid mi?
   */
  async function loadMe() {
    const a = accessToken ?? getAccessToken();
    if (!a) {
      setMeInfo(null);
      return;
    }
    const info = await me(a);
    setMeInfo(info);
  }

  /**
   * Organizations listele
   */
  async function loadOrganizations() {
    const a = accessToken ?? getAccessToken();
    if (!a) return;
    const list = await getOrganizations(a);
    setOrgs(list);
  }

  /**
   * Register:
   * - backend yeni user oluşturur
   * - access+refresh döner
   * - tokenları kaydederiz
   */
  async function onRegister() {
    const r = await register(email, password);
    saveTokens(r.accessToken, r.refreshToken);

    // UI'de de güncelle
    setAccessToken(r.accessToken);
    setRefreshTokenValue(r.refreshToken);

    await loadMe();
    await loadOrganizations();
  }

  /**
   * Login:
   * - mevcut user'a token verir
   */
  async function onLogin() {
    const r = await login(email, password);
    saveTokens(r.accessToken, r.refreshToken);

    setAccessToken(r.accessToken);
    setRefreshTokenValue(r.refreshToken);

    await loadMe();
    await loadOrganizations();
  }

  /**
   * Refresh (Rotate):
   * - refresh endpointi "rotation" yapıyor:
   *   eski refresh token revoke oluyor, yeni refresh token geliyor
   */
  async function onRefresh() {
    const rt = refreshTokenValue ?? getRefreshToken();
    if (!rt) return;

    const r = await refresh(rt);

    // Refresh rotate ettiği için refreshToken değişebilir
    saveTokens(r.accessToken, r.refreshToken);

    setAccessToken(r.accessToken);
    setRefreshTokenValue(r.refreshToken);

    await loadMe();
  }

  /**
   * Logout:
   * - refresh token revoke edilir
   * - localStorage temizlenir
   */
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
  }

  /**
   * Organization oluştur
   */
  async function onCreateOrg() {
    const a = accessToken ?? getAccessToken();
    if (!a) return;

    const created = await createOrganization(a, {
      name: orgName,
      taxNumber: orgTax,
      city: orgCity,
      district: orgDistrict,
      // description şimdilik boş bıraktık
    });

    // UI optimistik update: listeye başa ekle
    setOrgs((prev) => [created, ...prev]);

    // yeni tax number hazırla
    setOrgTax("tn-" + Math.floor(Math.random() * 1000000));
  }

  /**
   * Active/Pasif toggle
   */
  async function onToggleActive(id: string, current: boolean) {
    const a = accessToken ?? getAccessToken();
    if (!a) return;

    await setOrganizationActive(a, id, !current);

    // UI update
    setOrgs((prev) =>
      prev.map((x) => (x.id === id ? { ...x, isActive: !current } : x))
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-semibold">OrgManager Web (Next.js)</h1>

        {/* ================= AUTH ================= */}
        <section className="rounded-xl border p-4 space-y-3">
          <h2 className="text-lg font-medium">Auth</h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1">
              <div className="text-sm text-gray-600">Email</div>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@orgmanager.local"
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-gray-600">Password</div>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="a12345"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md border px-3 py-2 hover:bg-gray-50"
              onClick={() => safe(onRegister)}
            >
              Register
            </button>
            <button
              className="rounded-md border px-3 py-2 hover:bg-gray-50"
              onClick={() => safe(onLogin)}
            >
              Login
            </button>
            <button
              className="rounded-md border px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => safe(onRefresh)}
              disabled={!getRefreshToken() && !refreshTokenValue}
              title="Refresh rotation testi"
            >
              Refresh (Rotate)
            </button>
            <button
              className="rounded-md border px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
              onClick={() => safe(loadMe)}
              disabled={!isAuthed}
            >
              /me
            </button>
            <button
              className="rounded-md border px-3 py-2 hover:bg-gray-50"
              onClick={() => safe(onLogout)}
            >
              Logout
            </button>
          </div>

          <div className="text-sm">
            <div><b>AccessToken:</b> {accessToken ? "var ✅" : "yok ❌"}</div>
            <div><b>RefreshToken:</b> {refreshTokenValue ? "var ✅" : "yok ❌"}</div>
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

        {/* ============== ORGANIZATIONS ============== */}
        <section className="rounded-xl border p-4 space-y-3">
          <h2 className="text-lg font-medium">Organizations</h2>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-md border px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
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
            className="rounded-md border px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
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
                    <div>
                      <div className="font-medium">{o.name}</div>
                      <div className="text-sm text-gray-600">
                        {o.city} / {o.district} — tax: {o.taxNumber}
                      </div>
                      <div className="text-sm">
                        Active: <b>{String(o.isActive)}</b>
                      </div>
                    </div>

                    <button
                      className="rounded-md border px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
                      onClick={() => safe(() => onToggleActive(o.id, o.isActive))}
                      disabled={!isAuthed}
                      title="Aktif/Pasif değiştir"
                    >
                      Toggle Active
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* ============== ERROR ============== */}
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