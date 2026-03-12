"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { register } from "@/lib/api";
import {
  AppButton,
  AppCard,
  AppHero,
  AppLinkButton,
  AppPage,
} from "@/components/ui";
import { AppField, AppInput } from "@/components/form-ui";

export default function RegisterPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!email.trim()) {
      showToast({ message: "E-posta alanı zorunludur.", type: "error" });
      return;
    }

    if (!password.trim()) {
      showToast({ message: "Şifre alanı zorunludur.", type: "error" });
      return;
    }

    if (password.length < 6) {
      showToast({ message: "Şifre en az 6 karakter olmalıdır.", type: "error" });
      return;
    }

    if (password !== confirmPassword) {
      showToast({
        message: "Şifre ve şifre tekrar alanları aynı olmalıdır.",
        type: "error",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await register({ email: email.trim(), password });

      showToast({
        message:
          result.message ??
          "Kayıt başarılı. Giriş yapmadan önce e-posta adresini doğrulamalısın.",
        type: "success",
      });

      router.push(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Kayıt işlemi tamamlanamadı.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppPage>
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center">
        <div className="grid w-full gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-[32px] border border-white/70 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
            <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium text-white/90">
              OrgManager
            </div>

            <h1 className="mt-6 text-4xl font-semibold tracking-tight">
              Yeni hesabını oluştur
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
              Sisteme kayıt olup organizasyon davetlerini yönetebilir, katılım kodu
              ile başvurabilir ve dahil olduğun yapıları tek panelden takip edebilirsin.
            </p>
          </section>

          <AppCard className="rounded-[32px] p-8">
            <AppHero
              badge="Kayıt"
              title="Yeni hesap oluştur"
              description="E-posta ve şifre bilgilerini girerek sisteme kayıt olabilirsin."
            />

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <AppField label="E-posta">
                <AppInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                />
              </AppField>

              <AppField label="Şifre">
                <AppInput
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="En az 6 karakter"
                />
              </AppField>

              <AppField label="Şifre tekrar">
                <AppInput
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Şifreyi tekrar gir"
                />
              </AppField>

              <div className="pt-2">
                <AppButton
                  type="submit"
                  tone="primary"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? "Kayıt oluşturuluyor..." : "Kayıt ol"}
                </AppButton>
              </div>
            </form>

            <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-gray-600">Zaten hesabın var mı?</span>
              <AppLinkButton href="/login">Giriş yap</AppLinkButton>
            </div>
          </AppCard>
        </div>
      </div>
    </AppPage>
  );
}