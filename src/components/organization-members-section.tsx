"use client";

import { useMemo } from "react";
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

function InfoChip({
  label,
  tone = "default",
}: {
  label: string;
  tone?: "default" | "green";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
        tone === "green"
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-100 text-slate-700"
      }`}
    >
      {label}
    </span>
  );
}

function roleOrder(role: string) {
  if (role === "Owner") return 0;
  if (role === "Assistant") return 1;
  return 2;
}

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
  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const byRole = roleOrder(a.role) - roleOrder(b.role);
      if (byRole !== 0) return byRole;

      if (a.isActive !== b.isActive) {
        return a.isActive ? -1 : 1;
      }

      return (a.email ?? "").localeCompare(b.email ?? "", "tr");
    });
  }, [members]);

  return (
    <AppCard>
      <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-5">
        <AppSectionHeader
          title="Organizasyon üyeleri"
          description="Organizasyona kayıtlı kullanıcıları görüntüleyebilir ve yetkiliysen yönetebilirsin."
        />
      </div>

      {canManageOrganization ? (
        <form
          onSubmit={onAddMember}
          className="mt-6 rounded-[28px] border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-blue-50/20 p-5 shadow-sm"
        >
          <div className="mb-4">
            <div className="text-sm text-slate-500">Yeni üye ekleme</div>
            <div className="mt-1 text-lg font-semibold tracking-tight text-slate-900">
              Organizasyona kullanıcı ekle
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px_180px]">
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
                {actionLoading ? "Ekleniyor..." : "Üye ekle"}
              </AppButton>
            </div>
          </div>
        </form>
      ) : null}

      {loading ? (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
          Üyeler yükleniyor...
        </div>
      ) : sortedMembers.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50/70 p-5 text-sm text-slate-600">
          Henüz üye bulunmuyor.
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {sortedMembers.map((member) => {
            const isMemberOwner = member.role === "Owner";

            return (
              <div
                key={member.id}
                className={`rounded-[28px] border p-5 shadow-sm ${
                  isMemberOwner
                    ? "border-amber-200 bg-gradient-to-r from-amber-50 via-white to-amber-50/40"
                    : "border-slate-200 bg-gradient-to-r from-white via-slate-50 to-slate-50"
                }`}
              >
                <div className="flex flex-col gap-4">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
                    <div className="min-w-0">
                      <div className="break-all text-xl font-semibold tracking-tight text-slate-900">
                        {member.email}
                      </div>

                      <div className="mt-2 break-all text-xs leading-5 text-slate-500">
                        UserId: {member.userId}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <MemberRoleBadge role={member.role} />
                        <InfoChip
                          label={member.isActive ? "Üye aktif" : "Üye pasif"}
                          tone={member.isActive ? "green" : "default"}
                        />
                        {isMemberOwner ? (
                          <InfoChip label="Organizasyon sahibi" />
                        ) : null}
                      </div>
                    </div>

                    {!isMemberOwner && canManageOrganization ? (
                      <div className="rounded-[24px] border border-slate-200 bg-white/85 p-4">
                        <div className="mb-3 text-sm font-semibold text-slate-900">
                          Üye aksiyonları
                        </div>

                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
                          <AppButton
                            onClick={() => onToggleRole(member)}
                            disabled={actionLoading}
                            className="w-full"
                          >
                            {member.role === "Assistant"
                              ? "Member yap"
                              : "Assistant yap"}
                          </AppButton>

                          <AppButton
                            onClick={() => onToggleActive(member)}
                            disabled={actionLoading}
                            className="w-full"
                          >
                            {member.isActive ? "Pasif et" : "Aktif et"}
                          </AppButton>

                          <AppButton
                            tone="warning"
                            onClick={() => onTransferOwnership(member)}
                            disabled={actionLoading}
                            className="w-full"
                          >
                            Owner yap
                          </AppButton>

                          <AppButton
                            tone="danger"
                            onClick={() => onDeleteMember(member)}
                            disabled={actionLoading}
                            className="w-full"
                          >
                            Çıkar
                          </AppButton>
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {isMemberOwner ? (
                    <div className="rounded-2xl border border-amber-200 bg-white/80 px-4 py-3 text-sm leading-6 text-slate-700">
                      Bu kullanıcı organizasyon owner’ıdır. Owner rolü doğrudan bu
                      kart üzerinden değiştirilemez veya silinemez. Gerekirse
                      ownership transfer işlemi ile başka bir üyeye devredilmelidir.
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppCard>
  );
}