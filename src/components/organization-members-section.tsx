"use client";

import { AppButton, AppCard, AppSectionHeader } from "@/components/ui";
import { AppField, AppInput, AppSelect } from "@/components/form-ui";
import { MemberRoleBadge } from "@/components/badges";
import type { OrganizationMemberDto } from "@/lib/api";

type MembersSectionProps = {
  members: OrganizationMemberDto[];
  loading: boolean;
  canManageOrganization: boolean;
  actionLoading: boolean;
  memberEmail: string;
  memberRole: "Member" | "Assistant";
  onMemberEmailChange: (value: string) => void;
  onMemberRoleChange: (value: "Member" | "Assistant") => void;
  onAddMember: (e: React.FormEvent<HTMLFormElement>) => void;
  onToggleRole: (member: OrganizationMemberDto) => void;
  onToggleActive: (member: OrganizationMemberDto) => void;
  onTransferOwnership: (member: OrganizationMemberDto) => void;
  onDeleteMember: (member: OrganizationMemberDto) => void;
};

export function OrganizationMembersSection({
  members,
  loading,
  canManageOrganization,
  actionLoading,
  memberEmail,
  memberRole,
  onMemberEmailChange,
  onMemberRoleChange,
  onAddMember,
  onToggleRole,
  onToggleActive,
  onTransferOwnership,
  onDeleteMember,
}: MembersSectionProps) {
  return (
    <AppCard>
      <AppSectionHeader
        title="Organizasyon üyeleri"
        description="Organizasyona kayıtlı kullanıcıları görüntüleyebilir ve yetkiliysen yönetebilirsin."
      />

      {canManageOrganization ? (
        <form
          onSubmit={onAddMember}
          className="mb-6 grid gap-3 rounded-3xl border border-gray-200 bg-gray-50/80 p-4 sm:grid-cols-[1fr_180px_160px]"
        >
          <AppField label="Üye e-posta">
            <AppInput
              type="email"
              value={memberEmail}
              onChange={(e) => onMemberEmailChange(e.target.value)}
              placeholder="kullanici@email.com"
            />
          </AppField>

          <AppField label="Rol">
            <AppSelect
              value={memberRole}
              onChange={(e) =>
                onMemberRoleChange(e.target.value as "Member" | "Assistant")
              }
            >
              <option value="Member">Member</option>
              <option value="Assistant">Assistant</option>
            </AppSelect>
          </AppField>

          <div className="flex items-end">
            <AppButton
              type="submit"
              tone="primary"
              disabled={actionLoading}
              className="w-full"
            >
              Üye ekle
            </AppButton>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="text-sm text-gray-600">Üyeler yükleniyor...</div>
      ) : members.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/70 p-5 text-sm text-gray-600">
          Henüz üye bulunmuyor.
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => {
            const isMemberOwner = member.role === "Owner";

            return (
              <div
                key={member.id}
                className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm"
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
                        <AppButton
                          onClick={() => onToggleRole(member)}
                          disabled={actionLoading}
                        >
                          {member.role === "Assistant"
                            ? "Member yap"
                            : "Assistant yap"}
                        </AppButton>

                        <AppButton
                          onClick={() => onToggleActive(member)}
                          disabled={actionLoading}
                        >
                          {member.isActive ? "Pasif et" : "Aktif et"}
                        </AppButton>

                        <AppButton
                          tone="warning"
                          onClick={() => onTransferOwnership(member)}
                          disabled={actionLoading}
                        >
                          Owner yap
                        </AppButton>

                        <AppButton
                          tone="danger"
                          onClick={() => onDeleteMember(member)}
                          disabled={actionLoading}
                        >
                          Çıkar
                        </AppButton>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppCard>
  );
}