"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addOrganizationMember,
  deleteOrganizationMember,
  getMe,
  getOrganizationById,
  getOrganizationMembers,
  setOrganizationActive,
  updateOrganizationMember,
  type MeResponse,
  type OrganizationDto,
  type OrganizationMemberDto,
} from "@/lib/api";

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

function MemberRoleBadge({ role }: { role: string }) {
  const normalized = role.toLowerCase();

  if (normalized === "owner") {
    return (
      <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
        Owner
      </span>
    );
  }

  if (normalized === "assistant") {
    return (
      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
        Assistant
      </span>
    );
  }

  return (
    <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
      Member
    </span>
  );
}

export default function OrganizationDetailsClient({ id }: { id: string }) {
  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"Member" | "Assistant">("Member");

  const [error, setError] = useState<string | null>(null);

  async function loadOrganizationDetails() {
    setError(null);
    setLoading(true);

    try {
      if (!id) {
        setOrg(null);
        setError("Organization id bulunamadı.");
        return;
      }

      const [orgData, meData] = await Promise.all([
        getOrganizationById(id),
        getMe(),
      ]);

      setOrg(orgData);
      setMe(meData);
    } catch (e: any) {
      setOrg(null);
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function loadMembers() {
    setMembersLoading(true);

    try {
      const data = await getOrganizationMembers(id);
      setMembers(data);
    } catch (e: any) {
      setError(e?.message ?? "Üyeler yüklenemedi.");
    } finally {
      setMembersLoading(false);
    }
  }

  async function refreshAll() {
    await Promise.all([loadOrganizationDetails(), loadMembers()]);
  }

  useEffect(() => {
    refreshAll();
  }, [id]);

  const isOwner = useMemo(() => {
    if (!org?.ownerUserId || !me?.userId) return false;
    return org.ownerUserId === me.userId;
  }, [org?.ownerUserId, me?.userId]);

  async function handleToggleActive() {
    if (!org?.id || typeof org.isActive !== "boolean") return;

    setActionLoading(true);
    setError(null);

    try {
      await setOrganizationActive(org.id, !org.isActive);
      await loadOrganizationDetails();
    } catch (e: any) {
      setError(e?.message ?? "Durum güncellenemedi.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!memberEmail.trim()) return;

    setActionLoading(true);
    setError(null);

    try {
      await addOrganizationMember(id, {
        email: memberEmail.trim(),
        role: memberRole,
      });

      setMemberEmail("");
      setMemberRole("Member");
      await loadMembers();
    } catch (e: any) {
      setError(e?.message ?? "Üye eklenemedi.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleRole(member: OrganizationMemberDto) {
    if (member.role === "Owner") return;

    const newRole = member.role === "Assistant" ? "Member" : "Assistant";

    setActionLoading(true);
    setError(null);

    try {
      await updateOrganizationMember(id, member.id, {
        role: newRole,
        isActive: member.isActive,
      });

      await loadMembers();
    } catch (e: any) {
      setError(e?.message ?? "Rol güncellenemedi.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleMemberActive(member: OrganizationMemberDto) {
    if (member.role === "Owner") return;

    setActionLoading(true);
    setError(null);

    try {
      await updateOrganizationMember(id, member.id, {
        role: member.role as "Member" | "Assistant",
        isActive: !member.isActive,
      });

      await loadMembers();
    } catch (e: any) {
      setError(e?.message ?? "Üye durumu güncellenemedi.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteMember(member: OrganizationMemberDto) {
    if (member.role === "Owner") return;

    const confirmed = window.confirm(
      `${member.email} kullanıcısını organizasyondan çıkarmak istiyor musun?`
    );

    if (!confirmed) return;

    setActionLoading(true);
    setError(null);

    try {
      await deleteOrganizationMember(id, member.id);
      await loadMembers();
    } catch (e: any) {
      setError(e?.message ?? "Üye silinemedi.");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Organizasyon detayları
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Organizasyona ait bilgileri ve üyeleri görüntülüyorsun.
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

          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-gray-600">Durum</div>
              <div className="mt-1 text-base font-medium text-gray-900">
                {org?.isActive ? "Aktif" : "Pasif"}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Owner: {isOwner ? "Evet" : "Hayır"}
              </div>
            </div>

            <button
              type="button"
              onClick={handleToggleActive}
              disabled={actionLoading || !org}
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading
                ? "Güncelleniyor..."
                : org?.isActive
                ? "Pasife al"
                : "Aktif et"}
            </button>
          </div>

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
              label="Owner User Id"
              value={org?.ownerUserId ?? ""}
              mono
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

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Üyeler</h2>
            <p className="mt-1 text-sm text-gray-600">
              Organizasyona kayıtlı kullanıcıları buradan yönetebilirsin.
            </p>
          </div>

          <form
            onSubmit={handleAddMember}
            className="mb-6 grid gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:grid-cols-[1fr_180px_140px]"
          >
            <input
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="kullanici@email.com"
              className="rounded-xl border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-gray-500"
            />

            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value as "Member" | "Assistant")}
              className="rounded-xl border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-gray-500"
            >
              <option value="Member">Member</option>
              <option value="Assistant">Assistant</option>
            </select>

            <button
              type="submit"
              disabled={actionLoading}
              className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionLoading ? "Ekleniyor..." : "Üye ekle"}
            </button>
          </form>

          {membersLoading ? (
            <div className="text-sm text-gray-600">Üyeler yükleniyor...</div>
          ) : members.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
              Henüz üye bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {members.map((member) => {
                const isMemberOwner = member.role === "Owner";

                return (
                  <div
                    key={member.id}
                    className="rounded-xl border border-gray-200 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {member.email}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          UserId: {member.userId}
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="flex items-center gap-2">
                          <MemberRoleBadge role={member.role} />
                          <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                            {member.isActive ? "Aktif" : "Pasif"}
                          </span>
                        </div>

                        {!isMemberOwner ? (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleToggleRole(member)}
                              disabled={actionLoading}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {member.role === "Assistant"
                                ? "Member yap"
                                : "Assistant yap"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleMemberActive(member)}
                              disabled={actionLoading}
                              className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-800 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {member.isActive ? "Pasif et" : "Aktif et"}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteMember(member)}
                              disabled={actionLoading}
                              className="rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Çıkar
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}