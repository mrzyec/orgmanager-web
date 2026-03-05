"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getOrganizationById, type OrganizationDto } from "@/lib/api";

/**
 * Organization Details:
 * - URL'den gelen id ile backend'e gider
 * - GET /api/organizations/{id}
 * - Inputlara gerçek veriyi basar (readOnly)
 */

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
          setError("Organization id bulunamadı (route param).");
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
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">Organization Details</h1>

          <Link
            href="/dashboard"
            className="rounded-md border px-3 py-2 hover:bg-gray-50"
          >
            Back
          </Link>
        </div>

        <section className="rounded-xl border p-4 space-y-4">
          <div className="text-sm text-gray-600">{loading ? "Yükleniyor..." : " "}</div>

          {error && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 sm:col-span-2">
              <div className="text-sm text-gray-600">Organization Id</div>
              <input
                className="w-full rounded-md border px-3 py-2 font-mono"
                value={id}
                readOnly
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-gray-600">Name</div>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={org?.name ?? ""}
                readOnly
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-gray-600">Tax Number</div>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={org?.taxNumber ?? ""}
                readOnly
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-gray-600">City</div>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={org?.city ?? ""}
                readOnly
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-gray-600">District</div>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={org?.district ?? ""}
                readOnly
              />
            </label>

            <label className="space-y-1 sm:col-span-2">
              <div className="text-sm text-gray-600">Description</div>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={org?.description ?? ""}
                readOnly
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-gray-600">Is Active</div>
              <input
                className="w-full rounded-md border px-3 py-2"
                value={org ? String(org.isActive) : ""}
                readOnly
              />
            </label>

            <label className="space-y-1">
              <div className="text-sm text-gray-600">Created At (UTC)</div>
              <input
                className="w-full rounded-md border px-3 py-2 font-mono"
                value={org?.createdAtUtc ?? ""}
                readOnly
              />
            </label>
          </div>
        </section>
      </div>
    </main>
  );
}