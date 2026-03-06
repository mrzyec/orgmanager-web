"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createOrganization, getAccessToken, getMe } from "@/lib/api";

export default function NewOrganizationPage() {
  const router = useRouter();

  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLInputElement>(null);
  const taxNumberRef = useRef<HTMLInputElement>(null);
  const cityRef = useRef<HTMLInputElement>(null);
  const districtRef = useRef<HTMLInputElement>(null);

  const [checkingAuth, setCheckingAuth] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      try {
        const token = getAccessToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        await getMe();

        if (!cancelled) {
          setCheckingAuth(false);
        }
      } catch {
        if (!cancelled) {
          router.replace("/login");
        }
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    const name = nameRef.current?.value?.trim() ?? "";
    const description = descriptionRef.current?.value?.trim() ?? "";
    const taxNumber = taxNumberRef.current?.value?.trim() ?? "";
    const city = cityRef.current?.value?.trim() ?? "";
    const district = districtRef.current?.value?.trim() ?? "";

    setError("");
    setLoading(true);

    try {
      const created = await createOrganization({
        name,
        description,
        taxNumber,
        city,
        district,
      });

      router.replace(`/organizations/${created.id}`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Organizasyon oluşturulurken bir hata oluştu.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-3xl text-sm text-gray-600">
          Yetki kontrol ediliyor...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Yeni organizasyon
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Organizasyon bilgilerini girip kaydedebilirsin.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50"
          >
            Geri dön
          </Link>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1 sm:col-span-2">
                <div className="text-sm font-medium text-gray-700">Ad</div>
                <input
                  ref={nameRef}
                  name="name"
                  autoComplete="off"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-gray-500"
                  placeholder="Örn. OrgManager Spor Kulübü"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <div className="text-sm font-medium text-gray-700">Açıklama</div>
                <input
                  ref={descriptionRef}
                  name="description"
                  autoComplete="off"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-gray-500"
                  placeholder="Kısa açıklama"
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm font-medium text-gray-700">Vergi No</div>
                <input
                  ref={taxNumberRef}
                  name="taxNumber"
                  autoComplete="off"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-gray-500"
                  placeholder="Vergi numarası"
                />
              </label>

              <label className="space-y-1">
                <div className="text-sm font-medium text-gray-700">Şehir</div>
                <input
                  ref={cityRef}
                  name="city"
                  autoComplete="off"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-gray-500"
                  placeholder="İstanbul"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <div className="text-sm font-medium text-gray-700">İlçe</div>
                <input
                  ref={districtRef}
                  name="district"
                  autoComplete="off"
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-gray-500"
                  placeholder="Kadıköy"
                />
              </label>
            </div>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Kaydediliyor..." : "Organizasyon oluştur"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}