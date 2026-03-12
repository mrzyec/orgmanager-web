"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import PasswordInput from "@/components/PasswordInput";
import { getAccessToken, getMe, login } from "@/lib/api";

export default function LoginClient() {
  const router = useRouter();

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkExistingSession() {
      try {
        const token = getAccessToken();

        if (!token) {
          if (!cancelled) setCheckingAuth(false);
          return;
        }

        await getMe();

        if (!cancelled) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        // token geçersizse login ekranında kal
      } finally {
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

  useEffect(() => {
    const syncAutofillValues = () => {
      const emailValue = emailRef.current?.value ?? "";
      const passwordValue = passwordRef.current?.value ?? "";

      if (emailValue !== email) {
        setEmail(emailValue);
      }

      if (passwordValue !== password) {
        setPassword(passwordValue);
      }
    };

    const timeout1 = window.setTimeout(syncAutofillValues, 100);
    const timeout2 = window.setTimeout(syncAutofillValues, 500);
    const timeout3 = window.setTimeout(syncAutofillValues, 1000);

    return () => {
      window.clearTimeout(timeout1);
      window.clearTimeout(timeout2);
      window.clearTimeout(timeout3);
    };
  }, [email, password]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    const finalEmail = emailRef.current?.value ?? email;
    const finalPassword = passwordRef.current?.value ?? password;

    setEmail(finalEmail);
    setPassword(finalPassword);
    setError("");
    setNeedsVerification(false);
    setLoading(true);

    try {
      await login({
        email: finalEmail,
        password: finalPassword,
      });

      router.replace("/dashboard");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Giriş sırasında bir hata oluştu.";

      setError(message);

      if (message.toLowerCase().includes("doğrulamanız gerekiyor")) {
        setNeedsVerification(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <AuthCard title="Giriş kontrolü" subtitle="Oturum doğrulanıyor...">
          <div className="text-sm text-gray-600">Lütfen bekleyin.</div>
        </AuthCard>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <AuthCard
        title="OrgManager Giriş"
        subtitle="Hesabınla giriş yap ve organizasyonlarını yönet."
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
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@mail.com"
              className="w-full rounded-xl border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-gray-500"
            />
          </div>

          <PasswordInput
            ref={passwordRef}
            id="password"
            name="password"
            value={password}
            onChange={setPassword}
            showPassword={showPassword}
            onToggleShowPassword={() => setShowPassword((prev) => !prev)}
          />

          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300"
            />
            Şifreyi göster
          </label>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <div>{error}</div>

              {needsVerification && email.trim() ? (
                <div className="mt-2">
                  <Link
                    href={`/verify-email?email=${encodeURIComponent(email.trim())}`}
                    className="font-medium underline"
                  >
                    Doğrulama ekranına git
                  </Link>
                </div>
              ) : null}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş yap"}
          </button>

          <div className="text-center text-sm text-gray-600">
            Hesabın yok mu?{" "}
            <Link href="/register" className="font-medium text-black underline">
              Kayıt ol
            </Link>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}