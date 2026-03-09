"use client";

import Link from "next/link";
import type { OrganizationDto } from "@/lib/api";

type OrgsCardProps = {
  title?: string;
  organizations: OrganizationDto[];
};

function StatusBadge({ isActive }: { isActive?: boolean }) {
  if (isActive) {
    return (
      <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        Aktif
      </span>
    );
  }

  return (
    <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      Pasif
    </span>
  );
}

export default function OrgsCard({
  title = "Organizasyonlarım",
  organizations,
}: OrgsCardProps) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">
          Kayıtlı organizasyonlarını buradan görüntüleyebilirsin.
        </p>
      </div>

      {organizations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-5">
          <div className="text-base font-medium text-gray-900">
            Henüz organizasyon bulunmuyor
          </div>
          <div className="mt-1 text-sm text-gray-600">
            İlk organizasyonunu oluşturup yönetmeye başlayabilirsin.
          </div>

          <Link
            href="/organizations/new"
            className="mt-4 inline-flex rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            İlk organizasyonu oluştur
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/organizations/${org.id}`}
              className="block rounded-xl border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-medium text-gray-900">
                      {org.name}
                    </div>

                    <StatusBadge isActive={org.isActive} />
                  </div>

                  {org.description ? (
                    <div className="mt-1 text-sm text-gray-600">
                      {org.description}
                    </div>
                  ) : null}

                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                    {org.city ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        Şehir: {org.city}
                      </span>
                    ) : null}

                    {org.district ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        İlçe: {org.district}
                      </span>
                    ) : null}

                    {org.taxNumber ? (
                      <span className="rounded-full bg-gray-100 px-2 py-1">
                        Vergi No: {org.taxNumber}
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="text-sm font-medium text-gray-700">
                  Detaya git
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}