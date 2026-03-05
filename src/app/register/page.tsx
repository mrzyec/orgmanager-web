
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { register } from "@/lib/api";
import { getAccessToken, saveTokens } from "@/lib/authStore";

/**
 * Register sayfası CLIENT COMPONENT.
 * Register başarılı olursa token döner → saveTokens → dashboard.
 */
function makeRandomEmail() {
  const rnd = Math.random().toString(16).slice(2, 10);
  return `ui_${rnd}@orgmanager.local`;
}

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("a12345");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // token varsa register’a gerek yok
  useEffect(() => {
    const a = getAccessToken();
    if (a) {
      router.replace("/dashboard");
      return;
    }
    setEmail(makeRandomEmail());
  }, [router]);

  async function onRegister() {
    try {
      setError(null);
      setLoading(true);

      const r = await register(email, password);

      saveTokens(r.accessToken, r.refreshToken);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.message ?? "Register failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-md space-y-4 rounded-xl border p-5">
        <h1 className="text-2xl font-semibold">Register</h1>

        <label className="block space-y-1">
          <div className="text-sm text-gray-600">Email</div>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ui_xxxx@orgmanager.local"
          />
          <div className="text-xs text-gray-500">
            İpucu: 409 yememek için başlangıçta random email geliyor.
          </div>
        </label>

        <label className="block space-y-1">
          <div className="text-sm text-gray-600">Password</div>
          <input
            className="w-full rounded-md border px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="a12345"
          />
        </label>

        <button
          className="w-full rounded-md border px-3 py-2 hover:bg-gray-50 disabled:opacity-50"
          onClick={onRegister}
          disabled={loading}
        >
          {loading ? "Registering..." : "Register"}
        </button>

        <div className="text-sm">
          Zaten hesabın var mı?{" "}
          <a className="underline" href="/login">
            Login
          </a>
        </div>

        {error && (
          <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
            <div className="font-medium">Hata</div>
            <pre className="mt-2 overflow-auto">{error}</pre>
          </div>
        )}
      </div>
    </main>
  );
}