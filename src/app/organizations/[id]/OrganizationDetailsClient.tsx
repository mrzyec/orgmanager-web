"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  addOrganizationMember,
  deleteOrganizationMember,
  getMe,
  getOrganizationById,
  getOrganizationMembers,
  setOrganizationActive,
  transferOrganizationOwnership,
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
  const { showToast } = useToast();

  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);

  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"Member" | "Assistant">("Member");

  const [pageError, setPageError] = useState<string | null>(null);

  async function loadOrganizationDetails(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;

    if (!silent) {
      setPageError(null);
      setLoading(true);
    }

    try {
      if (!id) {
        setOrg(null);
        setPageError("Organizasyon kimliği bulunamadı.");
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
      setPageError(e?.message ?? "Organizasyon bilgileri yüklenemedi.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }

  async function loadMembers(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;

    if (!silent) {
      setMembersLoading(true);
    }

    try {
      const data = await getOrganizationMembers(id);
      setMembers(data);
    } catch (e: any) {
      setPageError(e?.message ?? "Üyeler yüklenemedi.");
    } finally {
      if (!silent) {
        setMembersLoading(false);
      }
    }
  }

  async function refreshAll(options?: { silent?: boolean }) {
    await Promise.all([
      loadOrganizationDetails({ silent: options?.silent }),
      loadMembers({ silent: options?.silent }),
    ]);
  }

  useEffect(() => {
    refreshAll();
  }, [id]);

  const isOwner = useMemo(() => {
    if (!org?.ownerUserId || !me?.userId) return false;
    return org.ownerUserId === me.userId;
  }, [org?.ownerUserId, me?.userId]);

  const isSuperAdmin = useMemo(() => {
    return (me?.roles ?? []).includes("SuperAdmin");
  }, [me?.roles]);

  const canManageOrganization = isOwner || isSuperAdmin;

  async function handleToggleActive() {
    if (!org?.id || typeof org.isActive !== "boolean") return;

    setActionLoading(true);
    setPageError(null);

    try {
      await setOrganizationActive(org.id, !org.isActive);

      setOrg((prev) =>
        prev ? { ...prev, isActive: !prev.isActive } : prev
      );

      showToast({
        message: org.isActive
          ? "Organizasyon başarıyla pasif hale getirildi."
          : "Organizasyon başarıyla aktif hale getirildi.",
        type: "success",
      });

      await loadOrganizationDetails({ silent: true });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Organizasyon durumu güncellenemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!memberEmail.trim()) {
      showToast({
        message: "Lütfen geçerli bir e-posta gir.",
        type: "error",
      });
      return;
    }

    setActionLoading(true);
    setPageError(null);

    try {
      const added = await addOrganizationMember(id, {
        email: memberEmail.trim(),
        role: memberRole,
      });

      setMembers((prev) => [added, ...prev]);
      setMemberEmail("");
      setMemberRole("Member");

      showToast({
        message: "Üye başarıyla organizasyona eklendi.",
        type: "success",
      });

      await loadMembers({ silent: true });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Üye eklenemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleRole(member: OrganizationMemberDto) {
    if (member.role === "Owner") return;

    const newRole = member.role === "Assistant" ? "Member" : "Assistant";

    setActionLoading(true);
    setPageError(null);

    try {
      const updated = await updateOrganizationMember(id, member.id, {
        role: newRole,
        isActive: member.isActive,
      });

      setMembers((prev) =>
        prev.map((x) => (x.id === member.id ? updated : x))
      );

      showToast({
        message:
          newRole === "Assistant"
            ? "Kullanıcı Assistant rolüne geçirildi."
            : "Kullanıcı Member rolüne geçirildi.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Rol güncellenemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleMemberActive(member: OrganizationMemberDto) {
    if (member.role === "Owner") return;

    setActionLoading(true);
    setPageError(null);

    try {
      const updated = await updateOrganizationMember(id, member.id, {
        role: member.role as "Member" | "Assistant",
        isActive: !member.isActive,
      });

      setMembers((prev) =>
        prev.map((x) => (x.id === member.id ? updated : x))
      );

      showToast({
        message: member.isActive
          ? "Üye pasif hale getirildi."
          : "Üye tekrar aktif hale getirildi.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Üye durumu güncellenemedi.",
        type: "error",
      });
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
    setPageError(null);

    try {
      await deleteOrganizationMember(id, member.id);

      setMembers((prev) => prev.filter((x) => x.id !== member.id));

      showToast({
        message: "Üye organizasyondan çıkarıldı.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Üye silinemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleTransferOwnership(member: OrganizationMemberDto) {
    if (member.role === "Owner") return;

    const confirmed = window.confirm(
      `${member.email} kullanıcısını yeni owner yapmak istiyor musun? Mevcut owner Assistant rolüne düşecek.`
    );

    if (!confirmed) return;

    setActionLoading(true);
    setPageError(null);

    try {
      await transferOrganizationOwnership(id, member.userId);

      showToast({
        message: "Owner transfer başarıyla tamamlandı.",
        type: "success",
      });

      await refreshAll({ silent: true });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Owner transfer başarısız oldu.",
        type: "error",
      });
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

          {pageError ? (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {pageError}
            </div>
          ) : null}

          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm text-gray-600">Durum</div>
              <div className="mt-1 text-base font-medium text-gray-900">
                {org?.isActive ? "Aktif" : "Pasif"}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Owner: {isOwner ? "Evet" : "Hayır"} / SuperAdmin:{" "}
                {isSuperAdmin ? "Evet" : "Hayır"}
              </div>
            </div>

            {canManageOrganization ? (
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
            ) : null}
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

          {canManageOrganization ? (
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
          ) : null}

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

                        {canManageOrganization && !isMemberOwner ? (
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
                              onClick={() => handleTransferOwnership(member)}
                              disabled={actionLoading}
                              className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Owner yap
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