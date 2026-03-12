"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { resendVerificationEmail, verifyEmail } from "@/lib/api";
import { useToast } from "@/components/ToastProvider";
import {
  AppButton,
  AppCard,
  AppHero,
  AppLinkButton,
  AppPage,
} from "@/components/ui";
import { AppField, AppInput } from "@/components/form-ui";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const emailFromQuery = searchParams.get("email") ?? "";
  const tokenFromQuery = searchParams.get("token") ?? "";

  const [email, setEmail] = useState(emailFromQuery);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [devVerifyUrl, setDevVerifyUrl] = useState<string | null>(null);

  const canVerifyDirectly = useMemo(() => {
    return emailFromQuery.trim() !== "" && tokenFromQuery.trim() !== "";
  }, [emailFromQuery, tokenFromQuery]);

  async function handleVerify() {
    if (!canVerifyDirectly) return;

    setVerifying(true);
    setResultMessage("");

    try {
      const result = await verifyEmail(emailFromQuery, tokenFromQuery);

      setResultMessage(result.message ?? "E-posta adresi doğrulandı.");
      showToast({
        message: result.message ?? "E-posta adresi doğrulandı.",
        type: "success",
      });
    } catch (e: any) {
      const message = e?.message ?? "E-posta doğrulama işlemi başarısız oldu.";
      setResultMessage(message);
      showToast({
        message,
        type: "error",
      });
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (!email.trim()) {
      showToast({
        message: "Önce e-posta adresini gir.",
        type: "error",
      });
      return;
    }

    setResending(true);
    setDevVerifyUrl(null);

    try {
      const result = await resendVerificationEmail(email.trim());

      setResultMessage(result.message ?? "Doğrulama bağlantısı yeniden oluşturuldu.");
      setDevVerifyUrl(result.verifyUrl ?? null);

      showToast({
        message: result.message ?? "Doğrulama bağlantısı yeniden oluşturuldu.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Doğrulama bağlantısı yeniden gönderilemedi.",
        type: "error",
      });
    } finally {
      setResending(false);
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
              E-posta doğrulama
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/75">
              Hesabını kullanmaya başlamadan önce e-posta adresini doğrulaman gerekiyor.
              Doğrulama bağlantın varsa aşağıdan işlemi tamamlayabilir, bağlantı yoksa
              yeniden oluşturabilirsin.
            </p>
          </section>

          <AppCard className="rounded-[32px] p-8">
            <AppHero
              badge="Doğrulama"
              title="E-posta adresini doğrula"
              description="Doğrulama bağlantın geldiyse işlemi tamamla, gelmediyse yeniden bağlantı oluştur."
            />

            <div className="mt-8 space-y-4">
              <AppField label="E-posta">
                <AppInput
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                />
              </AppField>

              {canVerifyDirectly ? (
                <AppButton
                  type="button"
                  tone="primary"
                  className="w-full"
                  onClick={handleVerify}
                  disabled={verifying}
                >
                  {verifying ? "Doğrulanıyor..." : "E-posta doğrulamasını tamamla"}
                </AppButton>
              ) : null}

              <AppButton
                type="button"
                tone="secondary"
                className="w-full"
                onClick={handleResend}
                disabled={resending}
              >
                {resending
                  ? "Bağlantı oluşturuluyor..."
                  : "Doğrulama bağlantısını yeniden oluştur"}
              </AppButton>

              {resultMessage ? (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  {resultMessage}
                </div>
              ) : null}

              {devVerifyUrl ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <div className="font-medium">Development doğrulama bağlantısı</div>
                  <div className="mt-2 break-all">
                    <Link href={devVerifyUrl} className="underline">
                      {devVerifyUrl}
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm text-gray-600">Doğrulama tamamlandıysa</span>
              <AppLinkButton href="/login">Giriş yap</AppLinkButton>
            </div>
          </AppCard>
        </div>
      </div>
    </AppPage>
  );
}