"use client";

import { useToast } from "@/components/ToastProvider";
import OrganizationSectionShell from "@/components/organization-section-shell";
import { OrganizationMembersSection } from "@/components/organization-members-section";
import {
  addOrganizationMember,
  deleteOrganizationMember,
  setOrganizationActive,
  transferOrganizationOwnership,
  updateOrganizationMember,
  type OrganizationMemberDto,
} from "@/lib/api";
import { useOrganizationPageData } from "@/hooks/use-organization-page-data";
import { useState } from "react";

export default function OrganizationMembersPageClient({ id }: { id: string }) {
  const { showToast } = useToast();

  const {
    org,
    me,
    members,
    loading,
    actionLoading,
    setActionLoading,
    canManageOrganization,
    reload,
  } = useOrganizationPageData(id);

  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<"Member" | "Assistant">("Member");

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
      await reload({ silent: true });
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

      await reload({ silent: true });

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

      await reload({ silent: true });

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

      await reload({ silent: true });

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
      await reload({ silent: true });
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
      await reload({ silent: true });
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
        loading={loading}
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