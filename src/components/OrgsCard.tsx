"use client";

import Link from "next/link";
import type { OrganizationDto } from "@/lib/api";
import { AppCard } from "@/components/ui";

function formatUtcDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function StatusBadge({ isActive }: { isActive?: boolean }) {
  if (isActive) {
    return (
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        Aktif
      </span>
    );
  }

  return (
    <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      Pasif
    </span>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-slate-900 break-words">
        {value}
      </div>
    </div>
  );
}

export default function OrgsCard({
  organizations,
}: {
  organizations: OrganizationDto[];
}) {
  const activeCount = organizations.filter((x) => x.isActive).length;
  const passiveCount = organizations.filter((x) => !x.isActive).length;

  return (
    <AppCard>
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">
              Organizasyonlarım
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Dahil olduğun organizasyonları ve temel bilgilerini burada görebilir,
              detay sayfasına geçerek yönetim alanını açabilirsin.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
              Toplam: {organizations.length}
            </span>
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Aktif: {activeCount}
            </span>
            <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              Pasif: {passiveCount}
            </span>
          </div>
        </div>
      </div>

      {organizations.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-6 text-sm leading-6 text-slate-600">
          Henüz görüntülenecek organizasyon bulunmuyor.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/organizations/${org.id}`}
              className={`group block rounded-[28px] border p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl active:translate-y-[1px] active:scale-[0.995] ${
                org.isActive
                  ? "border-slate-200 bg-gradient-to-r from-white via-slate-50 to-emerald-50/30 hover:border-emerald-200"
                  : "border-slate-200 bg-gradient-to-r from-white via-slate-50 to-slate-100/70 hover:border-slate-300"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold tracking-tight text-slate-900">
                    {org.name || "İsimsiz organizasyon"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {org.city || "-"} / {org.district || "-"}
                  </p>
                </div>

                <StatusBadge isActive={org.isActive} />
              </div>

              <div className="mt-5 grid gap-3">
                <InfoBlock
                  label="Vergi numarası"
                  value={org.taxNumber || "-"}
                />
                <InfoBlock
                  label="Oluşturulma tarihi"
                  value={formatUtcDate(org.createdAtUtc)}
                />
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 transition-colors duration-200 group-hover:border-slate-300">
                <span className="text-xs font-medium text-slate-500">
                  Detay ve yönetim alanı
                </span>

                <span className="text-sm font-semibold text-slate-800 transition-transform duration-200 group-hover:translate-x-1">
                  İncele →
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AppCard>
  );
}