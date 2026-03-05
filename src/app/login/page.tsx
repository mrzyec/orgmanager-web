"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { login, register } from "@/lib/api";
import {
  getAccessToken,
  saveTokens,
  clearTokens,
} from "@/lib/authStore";

function makeRandomEmail() {
  const rnd = Math.random().toString(16).slice(2, 10);
  return `ui_${rnd}@orgmanager.local`;
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("finaltest@orgmanager.local");
  const [password, setPassword] = useState("a12345");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Eğer zaten login ise dashboard'a at
  useEffect(() => {
    const token = getAccessToken();
    if (token) router.replace("/dashboard");
    else setEmail(makeRandomEmail()); // 409 olmasın diye random
  }, [router]);

  async function safe(fn: () => Promise<void>) {
    try {
      setError(null);
      setBusy(true);
      await fn();
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  async function onRegister() {
    const r = await register(email, password);
    saveTokens(r.accessToken, r.refreshToken);
    router.push("/dashboard");
  }

  async function onLogin() {
    const r = await login(email, password);
    saveTokens(r.accessToken, r.refreshToken);
    router.push("/dashboard");
  }

  function onClear() {
    clearTokens();
    setError(null);
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-xl space-y-6">
        <h1 className="text-2xl font-semibold">Login</h1>

        <section className="rounded-xl border p-4 space-y-3">
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
                (İpucu) Register 409 olmasın diye random email set ediliyor.
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
              className="rounded-md border px-3 py-2 hover:bg-gray-50 disabled:opacity-60"
              onClick={() => safe(onRegister)}
              disabled={busy}
            >
              Register
            </button>

            <button
              className="rounded-md border px-3 py-2 hover:bg-gray-50 disabled:opacity-60"
              onClick={() => safe(onLogin)}
              disabled={busy}
            >
              Login
            </button>

            <button
              className="rounded-md border px-3 py-2 hover:bg-gray-50 disabled:opacity-60"
              onClick={onClear}
              disabled={busy}
              title="localStorage tokenları temizler"
            >
              Clear Tokens
            </button>
          </div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}