"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { AppButton, AppCard } from "@/components/ui";
import { ReadonlyField } from "@/components/detail-ui";
import { AppField, AppInput, AppSelect } from "@/components/form-ui";
import OrganizationSectionShell from "@/components/organization-section-shell";
import {
  regenerateOrganizationJoinCode,
  setOrganizationActive,
} from "@/lib/api";
import { useOrganizationPageData } from "@/hooks/use-organization-page-data";
import { updateOrganizationSettings } from "@/lib/organization-settings-api";
import {
  CITY_DISTRICT_SUGGESTIONS,
  TURKEY_CITIES,
} from "@/lib/turkey-cities";

function formatUtcDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function SettingsBlock({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white/80 p-5 shadow-sm">
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {eyebrow}
        </div>
        <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
          {title}
        </div>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>

      {children}
    </div>
  );
}

export default function OrganizationSettingsPageClient({ id }: { id: string }) {
  const { showToast } = useToast();

  const {
    org,
    me,
    members,
    loading,
    actionLoading,
    setActionLoading,
    canManageOrganization,
    reload,
  } = useOrganizationPageData(id);

  const [name, setName] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [description, setDescription] = useState("");
  const [formDirty, setFormDirty] = useState(false);

  useEffect(() => {
    if (!org) return;

    setName(org.name ?? "");
    setTaxNumber(org.taxNumber ?? "");
    setCity(org.city ?? "");
    setDistrict(org.district ?? "");
    setDescription(org.description ?? "");
    setFormDirty(false);
  }, [org]);

  const sortedCityOptions = useMemo(() => {
    return [...TURKEY_CITIES].sort((a, b) => a.localeCompare(b, "tr"));
  }, []);

  const districtOptions = useMemo(() => {
    const items = CITY_DISTRICT_SUGGESTIONS[city] ?? [];
    return [...items].sort((a, b) => a.localeCompare(b, "tr"));
  }, [city]);

  const districtSelectionIsValid = useMemo(() => {
    if (!city || !district) return false;
    return districtOptions.includes(district);
  }, [city, district, districtOptions]);

  async function handleToggleActive() {
    if (!org?.id || typeof org.isActive !== "boolean") return;

    const targetIsActive = !org.isActive;
    const confirmed = window.confirm(
      targetIsActive
        ? "Bu organizasyonu aktif hale getirmek istiyor musun?"
        : "Bu organizasyonu pasif hale getirmek istiyor musun?"
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await setOrganizationActive(org.id, targetIsActive);
      await reload({ silent: true, force: true });

      showToast({
        message: targetIsActive
          ? "Organizasyon başarıyla aktif hale getirildi."
          : "Organizasyon başarıyla pasif hale getirildi.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Organizasyon durumu güncellenemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCopyJoinCode() {
    if (!org?.joinCode) return;

    try {
      await navigator.clipboard.writeText(org.joinCode);
      showToast({
        message: "Katılım kodu panoya kopyalandı.",
        type: "success",
      });
    } catch {
      showToast({
        message: "Katılım kodu kopyalanamadı.",
        type: "error",
      });
    }
  }

  async function handleRegenerateJoinCode() {
    if (!org?.id) return;

    setActionLoading(true);
    try {
      await regenerateOrganizationJoinCode(org.id);
      await reload({ silent: true, force: true });

      showToast({
        message: "Katılım kodu başarıyla yenilendi.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Katılım kodu yenilenemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSaveGeneralSettings(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!org?.id) return;

    if (!name.trim()) {
      showToast({
        message: "Organizasyon adı boş bırakılamaz.",
        type: "error",
      });
      return;
    }

    if (!taxNumber.trim()) {
      showToast({
        message: "Vergi numarası boş bırakılamaz.",
        type: "error",
      });
      return;
    }

    if (!city.trim()) {
      showToast({
        message: "Şehir boş bırakılamaz.",
        type: "error",
      });
      return;
    }

    if (!district.trim()) {
      showToast({
        message: "İlçe boş bırakılamaz.",
        type: "error",
      });
      return;
    }

    if (!districtSelectionIsValid) {
      showToast({
        message: "Seçilen şehir için listeden geçerli bir ilçe seçmelisin.",
        type: "error",
      });
      return;
    }

    setActionLoading(true);
    try {
      await updateOrganizationSettings(org.id, {
        name: name.trim(),
        taxNumber: taxNumber.trim(),
        city: city.trim(),
        district: district.trim(),
        description: description.trim() ? description.trim() : null,
      });

      await reload({ silent: true, force: true });
      setFormDirty(false);

      showToast({
        message: "Organizasyon bilgileri başarıyla güncellendi.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Organizasyon bilgileri güncellenemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <OrganizationSectionShell
      organizationId={id}
      org={org}
      me={me}
      members={members}
      canManageOrganization={canManageOrganization}
      actionLoading={actionLoading}
      onToggleActive={handleToggleActive}
      subtitle="Organizasyonun temel ayarlarını, join code bilgisini ve operasyonel işlemlerini bu sayfadan yönetebilirsin."
      showHeaderDangerAction = {false}
    >
      <AppCard>
        {loading ? (
          <div className="mb-4 text-sm text-slate-600">Yükleniyor...</div>
        ) : null}

        <div className="grid gap-6">
          <form
            onSubmit={handleSaveGeneralSettings}
            className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/20 p-5 shadow-sm"
          >
            <div className="mb-5">
              <div className="text-sm text-slate-500">Genel ayarlar</div>
              <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                Organizasyon bilgilerini düzenle
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Organizasyonun temel bilgilerini bu alandan daha düzenli bloklar
                halinde güncelleyebilirsin.
              </p>
            </div>

            <div className="grid gap-5">
              <SettingsBlock
                eyebrow="Bölüm 1"
                title="Temel bilgiler"
                description="Organizasyonun ana kimliğini oluşturan alanlar."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <AppField label="Organizasyon adı">
                    <AppInput
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setFormDirty(true);
                      }}
                      placeholder="Organizasyon adı"
                    />
                  </AppField>

                  <AppField label="Vergi numarası">
                    <AppInput
                      value={taxNumber}
                      onChange={(e) => {
                        setTaxNumber(e.target.value);
                        setFormDirty(true);
                      }}
                      placeholder="Vergi numarası"
                    />
                  </AppField>
                </div>
              </SettingsBlock>

              <SettingsBlock
                eyebrow="Bölüm 2"
                title="Konum bilgileri"
                description="Şehir ve ilçe alanlarını burada yönetebilirsin."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <AppField label="Şehir">
                    <AppSelect
                      value={city}
                      onChange={(e) => {
                        const nextCity = e.target.value;
                        setCity(nextCity);
                        setDistrict("");
                        setFormDirty(true);
                      }}
                    >
                      <option value="">Şehir seç</option>
                      {sortedCityOptions.map((cityOption) => (
                        <option key={cityOption} value={cityOption}>
                          {cityOption}
                        </option>
                      ))}
                    </AppSelect>
                  </AppField>

                  <AppField label="İlçe">
                    <AppSelect
                      value={district}
                      onChange={(e) => {
                        setDistrict(e.target.value);
                        setFormDirty(true);
                      }}
                      disabled={!city}
                    >
                      <option value="">
                        {city ? "İlçe seç" : "Önce şehir seç"}
                      </option>
                      {districtOptions.map((districtOption) => (
                        <option key={districtOption} value={districtOption}>
                          {districtOption}
                        </option>
                      ))}
                    </AppSelect>
                  </AppField>
                </div>

                <div className="mt-4">
                  {!city ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      İlçe seçebilmek için önce şehir seçmelisin.
                    </div>
                  ) : districtOptions.length === 0 ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Bu şehir için ilçe listesi henüz tanımlı değil.
                    </div>
                  ) : !district ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                      Seçili şehir için {districtOptions.length} ilçe bulundu.
                    </div>
                  ) : !districtSelectionIsValid ? (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      Seçilen şehir için geçerli bir ilçe seçmelisin.
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      İl ve ilçe seçimi hazır.
                    </div>
                  )}
                </div>
              </SettingsBlock>

              <SettingsBlock
                eyebrow="Bölüm 3"
                title="Açıklama"
                description="Organizasyon hakkında kısa açıklama ekleyebilirsin."
              >
                <AppField label="Açıklama">
                  <textarea
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setFormDirty(true);
                    }}
                    placeholder="Organizasyon açıklaması"
                    rows={5}
                    className="w-full rounded-3xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                  />
                </AppField>
              </SettingsBlock>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <AppButton
                type="submit"
                disabled={
                  actionLoading ||
                  !formDirty ||
                  !city ||
                  !district ||
                  !districtSelectionIsValid
                }
              >
                {actionLoading ? "Kaydediliyor..." : "Bilgileri kaydet"}
              </AppButton>
            </div>
          </form>

          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-amber-50/20 p-5 shadow-sm">
              <div className="mb-4">
                <div className="text-sm text-slate-500">Katılım ayarları</div>
                <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                  Join code yönetimi
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Organizasyona katılım için kullanılan kodu buradan
                  görüntüleyebilir, kopyalayabilir veya yenileyebilirsin.
                </p>
              </div>

              <div className="grid gap-4">
                <ReadonlyField
                  label="Geçerli join code"
                  value={org?.joinCode ?? ""}
                  mono
                />
                <ReadonlyField
                  label="Organizasyon durumu"
                  value={org?.isActive ? "Aktif" : "Pasif"}
                />
                <ReadonlyField
                  label="Oluşturulma tarihi"
                  value={formatUtcDate(org?.createdAtUtc)}
                  mono
                />
              </div>

              {canManageOrganization ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  <AppButton onClick={handleCopyJoinCode}>
                    Kodu kopyala
                  </AppButton>

                  <AppButton
                    onClick={handleRegenerateJoinCode}
                    disabled={actionLoading}
                  >
                    {actionLoading ? "İşleniyor..." : "Yeni kod üret"}
                  </AppButton>
                </div>
              ) : null}
            </div>

            <div className="rounded-[28px] border border-red-200 bg-gradient-to-r from-red-50 via-white to-red-50/40 p-5 shadow-sm">
              <div className="mb-4">
                <div className="text-sm text-red-600">Tehlikeli işlemler</div>
                <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
                  Organizasyon durumu
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Organizasyonu aktif veya pasif hale getirme işlemleri dikkatli
                  kullanılmalıdır.
                </p>
              </div>

              <div className="rounded-3xl border border-red-200 bg-white/90 p-4 text-sm leading-6 text-slate-700">
                Pasif durumda organizasyon görünürlüğü ve bazı akışlar
                etkilenebilir. Bu işlemi yapmadan önce emin olman gerekir.
              </div>

              {canManageOrganization ? (
                <div className="mt-5">
                  <AppButton
                    onClick={handleToggleActive}
                    disabled={actionLoading}
                  >
                    {actionLoading
                      ? "Güncelleniyor..."
                      : org?.isActive
                      ? "Organizasyonu pasife al"
                      : "Organizasyonu aktif et"}
                  </AppButton>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </AppCard>
    </OrganizationSectionShell>
  );
}