"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { createOrganization } from "@/lib/api";
import {
  AppButton,
  AppCard,
  AppHero,
  AppLinkButton,
  AppPage,
} from "@/components/ui";
import { AppField, AppInput, AppTextarea } from "@/components/form-ui";

export default function NewOrganizationPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!name.trim()) {
      showToast({
        message: "Organizasyon adı zorunludur.",
        type: "error",
      });
      return;
    }

    if (!taxNumber.trim()) {
      showToast({
        message: "Vergi numarası zorunludur.",
        type: "error",
      });
      return;
    }

    if (!city.trim()) {
      showToast({
        message: "Şehir bilgisi zorunludur.",
        type: "error",
      });
      return;
    }

    if (!district.trim()) {
      showToast({
        message: "İlçe bilgisi zorunludur.",
        type: "error",
      });
      return;
    }

    setSaving(true);

    try {
      const created = await createOrganization({
        name: name.trim(),
        taxNumber: taxNumber.trim(),
        city: city.trim(),
        district: district.trim(),
        description: description.trim() || undefined,
      });

      showToast({
        message: "Organizasyon başarıyla oluşturuldu.",
        type: "success",
      });

      router.push(`/organizations/${created.id}`);
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Organizasyon oluşturulamadı.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppPage>
      <AppHero
        badge="Organizasyon oluştur"
        title="Yeni organizasyon"
        description="Buradan yeni bir organizasyon oluşturabilir, ilk sahibi olarak yönetim sürecini başlatabilirsin."
        right={<AppLinkButton href="/dashboard">Dashboard</AppLinkButton>}
      />

      <AppCard>
        <div className="mb-6 rounded-[28px] border border-gray-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-5 shadow-sm">
          <div className="space-y-2">
            <div className="text-sm text-gray-500">Bilgilendirme</div>
            <div className="text-lg font-semibold tracking-tight text-gray-900">
              Organizasyon oluşturulduğunda owner rolü otomatik olarak sana atanır.
            </div>
            <p className="max-w-3xl text-sm leading-6 text-gray-600">
              İlk aşamada organizasyon, senin yönetiminde açılır. Ardından üye ekleme,
              katılım kodu paylaşma ve başvuru yönetimi işlemlerini detay ekranından
              sürdürebilirsin.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <AppField label="Organizasyon adı" className="sm:col-span-2">
            <AppInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: OrgManager Spor Kulübü"
            />
          </AppField>

          <AppField label="Vergi numarası">
            <AppInput
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
              placeholder="Vergi numarası"
            />
          </AppField>

          <AppField label="Şehir">
            <AppInput
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Şehir"
            />
          </AppField>

          <AppField label="İlçe">
            <AppInput
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="İlçe"
            />
          </AppField>

          <AppField label="Açıklama" className="sm:col-span-2">
            <AppTextarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Organizasyon hakkında kısa açıklama"
              rows={4}
            />
          </AppField>

          <div className="sm:col-span-2 flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
            <AppLinkButton href="/dashboard">Vazgeç</AppLinkButton>

            <AppButton type="submit" tone="primary" disabled={saving}>
              {saving ? "Oluşturuluyor..." : "Organizasyonu oluştur"}
            </AppButton>
          </div>
        </form>
      </AppCard>
    </AppPage>
  );
}