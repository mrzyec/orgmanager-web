// src/components/OrgsCard.tsx

"use client";

import Link from "next/link";
import type { OrganizationDto } from "@/lib/api";

type OrgsCardProps = {
  title?: string;
  organizations: OrganizationDto[];
};

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
        <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
          Henüz organizasyon bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3">
          {organizations.map((org) => (
            <Link
              key={org.id}
              href={`/organizations/${org.id}`}
              className="block rounded-xl border border-gray-200 p-4 transition hover:border-gray-300 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-base font-medium text-gray-900">
                    {org.name}
                  </div>

                  {org.description ? (
                    <div className="mt-1 text-sm text-gray-600">
                      {org.description}
                    </div>
                  ) : null}
                </div>

                {org.paymentPeriod ? (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                    {org.paymentPeriod}
                  </span>
                ) : null}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}