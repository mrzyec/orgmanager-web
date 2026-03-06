"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import PasswordInput from "@/components/PasswordInput";
import { getAccessToken, getMe, register } from "@/lib/api";

function makeRandomEmail() {
  const rnd = Math.random().toString(16).slice(2, 10);
  return `ui_${rnd}@orgmanager.local`;
}

export default function RegisterPage() {
  const router = useRouter();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkExistingSession() {
      try {
        const token = getAccessToken();

        if (!token) {
          if (!cancelled) {
            setCheckingAuth(false);
          }
          return;
        }

        await getMe();

        if (!cancelled) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        if (!cancelled) {
          setCheckingAuth(false);
        }
      }
    }

    checkExistingSession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function fillRandomEmail() {
    if (!emailRef.current) return;
    emailRef.current.value = makeRandomEmail();
    emailRef.current.focus();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    const email = emailRef.current?.value?.trim() ?? "";
    const password = passwordRef.current?.value ?? "";

    setError("");
    setLoading(true);

    try {
      const result = await register({
        email,
        password,
      });

      if (result?.accessToken) {
        router.replace("/dashboard");
        return;
      }

      router.replace("/login");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Kayıt sırasında bir hata oluştu.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <AuthCard title="Kayıt kontrolü" subtitle="Oturum doğrulanıyor...">
          <div className="text-sm text-gray-600">Lütfen bekleyin.</div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <AuthCard
        title="OrgManager Kayıt"
        subtitle="Yeni hesap oluştur ve organizasyonlarını yönetmeye başla."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              E-posta
            </label>

            <input
              ref={emailRef}
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ornek@mail.com"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-gray-500"
            />

            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="text-xs text-gray-500">
                İstersen test için random email üretebilirsin.
              </div>

              <button
                type="button"
                onClick={fillRandomEmail}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Random üret
              </button>
            </div>
          </div>

          <PasswordInput
            ref={passwordRef}
            id="password"
            name="password"
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword((prev) => !prev)}
          />

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Kayıt oluşturuluyor..." : "Kayıt ol"}
          </button>

          <div className="text-center text-sm text-gray-600">
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="font-medium text-black underline">
              Giriş yap
            </Link>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}