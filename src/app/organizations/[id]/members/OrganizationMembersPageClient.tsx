"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import OrganizationSectionShell from "@/components/organization-section-shell";
import { OrganizationMembersSection } from "@/components/organization-members-section";
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

export default function OrganizationMembersPageClient({ id }: { id: string }) {
  const { showToast } = useToast();

  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"Member" | "Assistant">("Member");

  async function loadData(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
      setMembersLoading(true);
    }

    try {
      const [orgData, meData, memberData] = await Promise.all([
        getOrganizationById(id),
        getMe(),
        getOrganizationMembers(id),
      ]);

      setOrg(orgData);
      setMe(meData);
      setMembers(memberData);
    } finally {
      if (!silent) {
        setLoading(false);
        setMembersLoading(false);
      }
    }
  }

  useEffect(() => {
    loadData();
  }, [id]);

  const canManageOrganization = useMemo(() => {
    if (!org || !me) return false;
    return (me.roles ?? []).includes("SuperAdmin") || me.userId === org.ownerUserId;
  }, [me, org]);

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
      await loadData({ silent: true });
      showToast({
        message: targetIsActive
          ? "Organizasyon başarıyla aktif hale getirildi."
          : "Organizasyon başarıyla pasif hale getirildi.",
        type: "success",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAddMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!memberEmail.trim()) {
      showToast({ message: "Lütfen geçerli bir e-posta gir.", type: "error" });
      return;
    }

    setActionLoading(true);
    try {
      await addOrganizationMember(id, {
        email: memberEmail.trim(),
        role: memberRole,
      });

      setMemberEmail("");
      setMemberRole("Member");

      await loadData({ silent: true });

      showToast({
        message: "Üye başarıyla organizasyona eklendi.",
        type: "success",
      });
    } catch (e: any) {
      showToast({ message: e?.message ?? "Üye eklenemedi.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleRole(member: OrganizationMemberDto) {
    if (member.role === "Owner") return;

    const newRole = member.role === "Assistant" ? "Member" : "Assistant";

    setActionLoading(true);
    try {
      await updateOrganizationMember(id, member.id, {
        role: newRole,
        isActive: member.isActive,
      });

      await loadData({ silent: true });

      showToast({
        message:
          newRole === "Assistant"
            ? "Kullanıcı Assistant rolüne geçirildi."
            : "Kullanıcı Member rolüne geçirildi.",
        type: "success",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleMemberActive(member: OrganizationMemberDto) {
    if (member.role === "Owner") return;

    setActionLoading(true);
    try {
      await updateOrganizationMember(id, member.id, {
        role: member.role as "Member" | "Assistant",
        isActive: !member.isActive,
      });

      await loadData({ silent: true });

      showToast({
        message: member.isActive ? "Üye pasif hale getirildi." : "Üye tekrar aktif hale getirildi.",
        type: "success",
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
    try {
      await deleteOrganizationMember(id, member.id);
      await loadData({ silent: true });
      showToast({ message: "Üye organizasyondan çıkarıldı.", type: "success" });
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
    try {
      await transferOrganizationOwnership(id, member.userId);
      await loadData({ silent: true });
      showToast({ message: "Owner transfer başarıyla tamamlandı.", type: "success" });
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
      subtitle="Organizasyona kayıtlı kullanıcıları bu sayfadan görüntüleyebilir ve yönetebilirsin."
    >
      <OrganizationMembersSection
        members={members}
        loading={loading || membersLoading}
        canManageOrganization={canManageOrganization}
        actionLoading={actionLoading}
        memberEmail={memberEmail}
        memberRole={memberRole}
        onMemberEmailChange={setMemberEmail}
        onMemberRoleChange={setMemberRole}
        onAddMember={handleAddMember}
        onToggleRole={handleToggleRole}
        onToggleActive={handleToggleMemberActive}
        onTransferOwnership={handleTransferOwnership}
        onDeleteMember={handleDeleteMember}
      />
    </OrganizationSectionShell>
  );
}