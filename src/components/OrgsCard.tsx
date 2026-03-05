"use client";

import { useState } from "react";
import {
  createOrganization,
  getOrganizations,
  setOrganizationActive,
  type OrganizationDto,
} from "@/lib/api";
import { getAccessToken } from "@/lib/authStore";

type Props = {
  isAuthed: boolean;
  orgs: OrganizationDto[];
  setOrgs: (v: OrganizationDto[] | ((prev: OrganizationDto[]) => OrganizationDto[])) => void;

  safe: (fn: () => Promise<void>) => Promise<void>;
};

export default function OrgsCard({ isAuthed, orgs, setOrgs, safe }: Props) {
  const [orgName, setOrgName] = useState("Org From UI");
  const [orgTax, setOrgTax] = useState("tn-" + Math.floor(Math.random() * 1000000));
  const [orgCity, setOrgCity] = useState("Istanbul");
  const [orgDistrict, setOrgDistrict] = useState("Kadikoy");

  async function loadOrganizations() {
    const a = getAccessToken();
    if (!a) return;

    const list = await getOrganizations();
    setOrgs(list);
  }

  async function onCreateOrg() {
    const a = getAccessToken();
    if (!a) return;

    const created = await createOrganization({
      name: orgName,
      taxNumber: orgTax,
      city: orgCity,
      district: orgDistrict,
    });

    setOrgs((prev) => [created, ...prev]);
    setOrgTax("tn-" + Math.floor(Math.random() * 1000000));
  }

  async function onToggleActive(id: string, current: boolean) {
    const a = getAccessToken();
    if (!a) return;

    await setOrganizationActive(id, !current);

    setOrgs((prev) =>
      prev.map((x) => (x.id === id ? { ...x, isActive: !current } : x))
    );
  }

  return (
    <section className="rounded-xl border p-4 space-y-3">
      <h2 className="text-lg font-medium">Organizations</h2>

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-md border px-3 py-2 hover:bg-gray-50"
          onClick={() => safe(loadOrganizations)}
          disabled={!isAuthed}
          title="GET /api/organizations"
        >
          Listele
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <div className="text-sm text-gray-600">Name</div>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-gray-600">Tax Number</div>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={orgTax}
            onChange={(e) => setOrgTax(e.target.value)}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-gray-600">City</div>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={orgCity}
            onChange={(e) => setOrgCity(e.target.value)}
          />
        </label>

        <label className="space-y-1">
          <div className="text-sm text-gray-600">District</div>
          <input
            className="w-full rounded-md border px-3 py-2"
            value={orgDistrict}
            onChange={(e) => setOrgDistrict(e.target.value)}
          />
        </label>
      </div>

      <button
        className="rounded-md border px-3 py-2 hover:bg-gray-50"
        onClick={() => safe(onCreateOrg)}
        disabled={!isAuthed}
        title="POST /api/organizations"
      >
        Create Organization
      </button>

      <div className="space-y-2">
        {orgs.length === 0 ? (
          <div className="text-sm text-gray-600">Liste boş.</div>
        ) : (
          orgs.map((o) => (
            <div key={o.id} className="rounded-md border p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{o.name}</div>
                  <div className="text-sm text-gray-600">
                    {o.city} / {o.district} — tax: {o.taxNumber}
                  </div>
                  <div className="text-sm">
                    Active: <b>{String(o.isActive)}</b>
                  </div>
                </div>

                <button
                  className="rounded-md border px-3 py-2 hover:bg-gray-50"
                  onClick={() => safe(() => onToggleActive(o.id, o.isActive))}
                  disabled={!isAuthed}
                  title="PATCH /api/organizations/{id}/active"
                >
                  Toggle Active
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}