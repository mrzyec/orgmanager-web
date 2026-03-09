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
      <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
        Aktif
      </span>
    );
  }

  return (
    <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
      Pasif
    </span>
  );
}

export default function OrgsCard({
  organizations,
}: {
  organizations: OrganizationDto[];
}) {
  return (
    <AppCard>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900">
            Organizasyonlarım
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Dahil olduğun organizasyonları ve temel bilgilerini burada görebilirsin.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700">
          Toplam: {organizations.length}
        </div>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/70 p-5 text-sm text-gray-600">
          Henüz görüntülenecek organizasyon bulunmuyor.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/organizations/${org.id}`}
              className="group block rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-gray-400 hover:shadow-lg hover:-translate-y-1 active:translate-y-[1px] active:scale-[0.995]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-lg font-semibold tracking-tight text-gray-900">
                    {org.name || "İsimsiz organizasyon"}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {org.city || "-"} / {org.district || "-"}
                  </p>
                </div>

                <StatusBadge isActive={org.isActive} />
              </div>

              <div className="mt-4 space-y-2">
                <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-3 py-2 transition-colors duration-200 group-hover:border-gray-200 group-hover:bg-gray-50">
                  <div className="text-xs text-gray-500">Vergi numarası</div>
                  <div className="mt-1 text-sm font-medium text-gray-800">
                    {org.taxNumber || "-"}
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 bg-gray-50/80 px-3 py-2 transition-colors duration-200 group-hover:border-gray-200 group-hover:bg-gray-50">
                  <div className="text-xs text-gray-500">Oluşturulma tarihi</div>
                  <div className="mt-1 text-sm font-medium text-gray-800">
                    {formatUtcDate(org.createdAtUtc)}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-xs text-gray-500">Detay ve yönetim alanı</span>

                <span className="text-sm font-medium text-gray-800 transition-transform duration-200 group-hover:translate-x-1">
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