"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getOrganizationById, type OrganizationDto } from "@/lib/api";

type ReadonlyFieldProps = {
  label: string;
  value: string;
  className?: string;
  mono?: boolean;
};

function ReadonlyField({
  label,
  value,
  className = "",
  mono = false,
}: ReadonlyFieldProps) {
  return (
    <label className={`space-y-1 ${className}`}>
      <div className="text-sm text-gray-600">{label}</div>
      <input
        className={`w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none read-only:bg-white read-only:text-gray-900 ${
          mono ? "font-mono" : ""
        }`}
        value={value}
        readOnly
      />
    </label>
  );
}

export default function OrganizationDetailsClient({ id }: { id: string }) {
  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function run() {
      try {
        setError(null);
        setLoading(true);

        if (!id) {
          setOrg(null);
          setError("Organization id bulunamadı.");
          return;
        }

        const data = await getOrganizationById(id);
        setOrg(data);
      } catch (e: any) {
        setOrg(null);
        setError(e?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [id]);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Organizasyon detayları
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Organizasyona ait bilgileri görüntülüyorsun.
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
          {loading ? (
            <div className="mb-4 text-sm text-gray-600">Yükleniyor...</div>
          ) : null}

          {error ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <ReadonlyField
              label="Organization Id"
              value={id ?? ""}
              className="sm:col-span-2"
              mono
            />

            <ReadonlyField label="Name" value={org?.name ?? ""} />
            <ReadonlyField label="Tax Number" value={org?.taxNumber ?? ""} />

            <ReadonlyField label="City" value={org?.city ?? ""} />
            <ReadonlyField label="District" value={org?.district ?? ""} />

            <ReadonlyField
              label="Description"
              value={org?.description ?? ""}
              className="sm:col-span-2"
            />

            <ReadonlyField
              label="Is Active"
              value={org ? String(org.isActive ?? "") : ""}
            />

            <ReadonlyField
              label="Created At (UTC)"
              value={org?.createdAtUtc ?? ""}
              mono
            />
          </div>
        </section>
      </div>
    </main>
  );
}