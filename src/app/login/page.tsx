"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { login } from "@/lib/api";

const secondaryButtonClass =
  "inline-flex items-center justify-center rounded-2xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm transition-all duration-200 hover:border-gray-500 hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

const primaryButtonClass =
  "inline-flex items-center justify-center rounded-2xl border border-black bg-black px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:border-gray-700 hover:bg-gray-900 hover:shadow-md hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60";

export default function LoginPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      showToast({
        message: "E-posta alanı zorunludur.",
        type: "error",
      });
      return;
    }

    if (!password.trim()) {
      showToast({
        message: "Şifre alanı zorunludur.",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      await login({
        email: email.trim(),
        password,
      });

      showToast({
        message: "Giriş başarılı. Dashboard yönlendiriliyorsun.",
        type: "success",
      });

      router.push("/dashboard");
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Giriş yapılamadı.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc,#eef2f7)] px-4 py-8">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[32px] border border-white/70 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              OrgManager
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight">
              Organizasyonunu tek merkezden yönet
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
              Üyeleri yönet, katılım kodlarını paylaş, başvuruları takip et ve
              organizasyon yapını düzenli bir panel üzerinden kontrol et.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Üyelik</div>
                <div className="mt-2 text-lg font-semibold">Rol bazlı yapı</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Başvuru</div>
                <div className="mt-2 text-lg font-semibold">Kod ile katılım</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">Yönetim</div>
                <div className="mt-2 text-lg font-semibold">Tek panel</div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/70 bg-white/92 p-8 shadow-[0_18px_44px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
              Giriş
            </div>

            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900">
              Hesabına giriş yap
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Mevcut hesabınla giriş yaparak organizasyonlarını ve başvurularını
              görüntüleyebilirsin.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block space-y-1">
                <div className="text-sm text-gray-600">E-posta</div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full rounded-3xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all duration-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100"
                />
              </label>

              <label className="block space-y-1">
                <div className="text-sm text-gray-600">Şifre</div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Şifreni gir"
                  className="w-full rounded-3xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all duration-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100"
                />
              </label>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`${primaryButtonClass} w-full`}
                >
                  {loading ? "Giriş yapılıyor..." : "Giriş yap"}
                </button>
              </div>
            </form>

            <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-gray-600">
                Henüz hesabın yok mu?
              </span>

              <Link href="/register" className={secondaryButtonClass}>
                Kayıt ol
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}