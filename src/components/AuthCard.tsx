"use client";

import { useMemo, useState } from "react";
import { login, logout, me, refreshManually, register } from "@/lib/api";
import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  saveTokens,
} from "@/lib/authStore";

type MeDto = { userId: string; email: string; userName: string };

type Props = {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;

  accessToken: string | null;
  setAccessToken: (v: string | null) => void;
  refreshTokenValue: string | null;
  setRefreshTokenValue: (v: string | null) => void;

  meInfo: MeDto | null;
  setMeInfo: (v: MeDto | null) => void;

  // Dışarıdan (page) gelen: global hata set etmek ve org listesini tazelemek için
  safe: (fn: () => Promise<void>) => Promise<void>;
  onAfterAuthChanged: () => Promise<void>; // örn: org listesi tazele
  onClearOrgs: () => void; // logout sonrası org listesini temizle
};

export default function AuthCard({
  email,
  setEmail,
  password,
  setPassword,
  accessToken,
  setAccessToken,
  refreshTokenValue,
  setRefreshTokenValue,
  meInfo,
  setMeInfo,
  safe,
  onAfterAuthChanged,
  onClearOrgs,
}: Props) {
  const isAuthed = useMemo(() => !!accessToken, [accessToken]);

  async function loadMe() {
    const a = accessToken ?? getAccessToken();
    if (!a) {
      setMeInfo(null);
      return;
    }

    const info = await me();
    setMeInfo(info);
  }

  async function onRegister() {
    const r = await register(email, password);

    saveTokens(r.accessToken, r.refreshToken);
    setAccessToken(r.accessToken);
    setRefreshTokenValue(r.refreshToken);

    await loadMe();
    await onAfterAuthChanged();
  }

  async function onLogin() {
    const r = await login(email, password);

    saveTokens(r.accessToken, r.refreshToken);
    setAccessToken(r.accessToken);
    setRefreshTokenValue(r.refreshToken);

    await loadMe();
    await onAfterAuthChanged();
  }

  async function onRefresh() {
    const rt = refreshTokenValue ?? getRefreshToken();
    if (!rt) return;

    const r = await refreshManually();
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
    onClearOrgs();
  }

  return (
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
          <div className="text-xs text-gray-500">
            İpucu: Register 409 olmasın diye sayfa açılışında random geliyor.
          </div>
        </label>

        <label className="space-y-1">
          <div className="text-sm text-gray-600">Password</div>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="password"
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
          className="rounded-md border px-3 py-2 hover:bg-gray-50"
          onClick={() => safe(onRefresh)}
          disabled={!refreshTokenValue}
          title="Normalde otomatik; istersen manuel refresh"
        >
          Refresh (Rotate)
        </button>

        <button
          className="rounded-md border px-3 py-2 hover:bg-gray-50"
          onClick={() => safe(loadMe)}
          disabled={!isAuthed}
          title="GET /api/auth/me"
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
  );
}