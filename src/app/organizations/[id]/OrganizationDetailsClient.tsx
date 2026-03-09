"use client";

import { useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import {
  AppButton,
  AppCard,
  AppHero,
  AppLinkButton,
  AppPage,
  AppSectionHeader,
} from "@/components/ui";
import {
  addOrganizationMember,
  deleteOrganizationMember,
  getMe,
  getOrganizationById,
  getOrganizationJoinRequests,
  getOrganizationMembers,
  regenerateOrganizationJoinCode,
  reviewOrganizationJoinRequest,
  setOrganizationActive,
  transferOrganizationOwnership,
  updateOrganizationMember,
  type MeResponse,
  type OrganizationDto,
  type OrganizationJoinRequestDto,
  type OrganizationMemberDto,
} from "@/lib/api";

function formatUtcDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

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
        className={`w-full rounded-3xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none read-only:bg-white read-only:text-gray-900 ${
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

function JoinRequestStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  if (normalized === "pending") {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
        Beklemede
      </span>
    );
  }

  if (normalized === "approved") {
    return (
      <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        Onaylandı
      </span>
    );
  }

  if (normalized === "rejected") {
    return (
      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
        Reddedildi
      </span>
    );
  }

  return (
    <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      {status}
    </span>
  );
}

function UserInitialAvatar({ email }: { email: string }) {
  const letter = (email?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gradient-to-br from-gray-100 to-white text-sm font-semibold text-gray-700 shadow-sm">
      {letter}
    </div>
  );
}

function StatusPill({
  label,
  active,
  tone = "neutral",
}: {
  label: string;
  active: boolean;
  tone?: "neutral" | "green" | "blue" | "yellow" | "purple";
}) {
  if (!active) {
    return (
      <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
        {label}
      </span>
    );
  }

  if (tone === "green") {
    return (
      <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 shadow-sm">
        {label}
      </span>
    );
  }

  if (tone === "blue") {
    return (
      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
        {label}
      </span>
    );
  }

  if (tone === "yellow") {
    return (
      <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700 shadow-sm">
        {label}
      </span>
    );
  }

  if (tone === "purple") {
    return (
      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
        {label}
      </span>
    );
  }

  return (
    <span className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
      {label}
    </span>
  );
}

export default function OrganizationDetailsClient({ id }: { id: string }) {
  const { showToast } = useToast();

  const [org, setOrg] = useState<OrganizationDto | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [members, setMembers] = useState<OrganizationMemberDto[]>([]);
  const [joinRequests, setJoinRequests] = useState<OrganizationJoinRequestDto[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [membersLoading, setMembersLoading] = useState(false);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
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
      if (!silent) setLoading(false);
    }
  }

  async function loadMembers(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    if (!silent) setMembersLoading(true);

    try {
      setMembers(await getOrganizationMembers(id));
    } catch (e: any) {
      setPageError(e?.message ?? "Üyeler yüklenemedi.");
    } finally {
      if (!silent) setMembersLoading(false);
    }
  }

  async function loadJoinRequests(options?: { silent?: boolean }) {
    const silent = options?.silent ?? false;
    if (!silent) setJoinRequestsLoading(true);

    try {
      setJoinRequests(await getOrganizationJoinRequests(id));
    } catch {
      setJoinRequests([]);
    } finally {
      if (!silent) setJoinRequestsLoading(false);
    }
  }

  async function refreshAll(options?: { silent?: boolean }) {
    await Promise.all([
      loadOrganizationDetails({ silent: options?.silent }),
      loadMembers({ silent: options?.silent }),
      loadJoinRequests({ silent: options?.silent }),
    ]);
  }

  useEffect(() => {
    refreshAll();
  }, [id]);

  const isOwner = useMemo(() => {
    if (!org?.ownerUserId || !me?.userId) return false;
    return org.ownerUserId === me.userId;
  }, [org?.ownerUserId, me?.userId]);

  const isSuperAdmin = useMemo(
    () => (me?.roles ?? []).includes("SuperAdmin"),
    [me?.roles]
  );

  const currentMembership = useMemo(() => {
    if (!me?.userId) return null;
    return members.find((x) => x.userId === me.userId) ?? null;
  }, [members, me?.userId]);

  const isAssistant = currentMembership?.role === "Assistant";
  const isMember = currentMembership?.role === "Member";

  const canManageOrganization = isOwner || isSuperAdmin;

  const pendingJoinRequests = useMemo(
    () => joinRequests.filter((x) => x.status === "Pending"),
    [joinRequests]
  );

  const reviewedJoinRequests = useMemo(
    () => joinRequests.filter((x) => x.status !== "Pending"),
    [joinRequests]
  );

  const heroTitle = useMemo(() => {
    if (!org?.name) return "Organizasyon detayları";
    return org.name;
  }, [org?.name]);

  const heroSubtitle = useMemo(() => {
    if (canManageOrganization) {
      return "Organizasyon ayarlarını, üyeleri ve katılım taleplerini bu ekrandan yönetebilirsin.";
    }

    return "Bu ekranda organizasyona ait temel bilgileri ve üyeleri görüntüleyebilirsin.";
  }, [canManageOrganization]);

  const managementSummaryTitle = useMemo(() => {
    if (isSuperAdmin && isOwner) return "Yönetim erişimin tam yetkili düzeyde.";
    if (isSuperAdmin) return "Bu organizasyonda SuperAdmin erişimin aktif.";
    if (isOwner) return "Bu organizasyonda Owner yetkin aktif.";
    if (isAssistant) return "Bu organizasyonda Assistant rolüyle yer alıyorsun.";
    if (isMember) return "Bu organizasyonda Member rolüyle yer alıyorsun.";
    return "Organizasyon bilgileri görüntüleniyor.";
  }, [isAssistant, isMember, isOwner, isSuperAdmin]);

  const managementSummaryDescription = useMemo(() => {
    if (isSuperAdmin && isOwner) {
      return "Organizasyonun tüm yönetim işlemlerini gerçekleştirebilir, üye ve başvuru süreçlerini tam yetkiyle kontrol edebilirsin.";
    }

    if (isSuperAdmin) {
      return "SuperAdmin rolün sayesinde organizasyon ayarlarını inceleyebilir ve yönetim işlemlerine erişebilirsin.";
    }

    if (isOwner) {
      return "Owner olarak organizasyonun aktiflik durumunu, katılım kodunu, üyeleri ve başvuru akışını yönetebilirsin.";
    }

    if (isAssistant) {
      return "Assistant rolüyle organizasyonda yer alıyorsun. Yetkili alanlara erişimin kural bazlı olarak sınırlandırılabilir.";
    }

    if (isMember) {
      return "Member rolüyle organizasyona dahilsin. Bu ekranda temel bilgileri ve mevcut üyeleri takip edebilirsin.";
    }

    return "Bu sayfa organizasyonun mevcut durumunu ve yapısını takip etmen için hazırlanmıştır.";
  }, [isAssistant, isMember, isOwner, isSuperAdmin]);

  async function handleToggleActive() {
    if (!org?.id || typeof org.isActive !== "boolean") return;

    setActionLoading(true);
    setPageError(null);

    try {
      await setOrganizationActive(org.id, !org.isActive);
      setOrg((prev) => (prev ? { ...prev, isActive: !prev.isActive } : prev));

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

  async function handleCopyJoinCode() {
    if (!org?.joinCode) return;

    try {
      await navigator.clipboard.writeText(org.joinCode);
      showToast({ message: "Katılım kodu panoya kopyalandı.", type: "success" });
    } catch {
      showToast({ message: "Katılım kodu kopyalanamadı.", type: "error" });
    }
  }

  async function handleRegenerateJoinCode() {
    if (!org?.id) return;

    setActionLoading(true);

    try {
      const updated = await regenerateOrganizationJoinCode(org.id);
      setOrg(updated);
      showToast({ message: "Katılım kodu başarıyla yenilendi.", type: "success" });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Katılım kodu yenilenemedi.",
        type: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleReviewJoinRequest(requestId: string, approve: boolean) {
    setActionLoading(true);

    try {
      await reviewOrganizationJoinRequest(requestId, approve);
      await Promise.all([loadJoinRequests({ silent: true }), loadMembers({ silent: true })]);

      showToast({
        message: approve ? "Katılım talebi onaylandı." : "Katılım talebi reddedildi.",
        type: "success",
      });
    } catch (e: any) {
      showToast({
        message: e?.message ?? "Katılım talebi değerlendirilemedi.",
        type: "error",
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
    setPageError(null);

    try {
      const added = await addOrganizationMember(id, {
        email: memberEmail.trim(),
        role: memberRole,
      });

      setMembers((prev) => [added, ...prev]);
      setMemberEmail("");
      setMemberRole("Member");

      showToast({ message: "Üye başarıyla organizasyona eklendi.", type: "success" });
      await loadMembers({ silent: true });
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
    setPageError(null);

    try {
      const updated = await updateOrganizationMember(id, member.id, {
        role: newRole,
        isActive: member.isActive,
      });

      setMembers((prev) => prev.map((x) => (x.id === member.id ? updated : x)));

      showToast({
        message:
          newRole === "Assistant"
            ? "Kullanıcı Assistant rolüne geçirildi."
            : "Kullanıcı Member rolüne geçirildi.",
        type: "success",
      });
    } catch (e: any) {
      showToast({ message: e?.message ?? "Rol güncellenemedi.", type: "error" });
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

      setMembers((prev) => prev.map((x) => (x.id === member.id ? updated : x)));

      showToast({
        message: member.isActive
          ? "Üye pasif hale getirildi."
          : "Üye tekrar aktif hale getirildi.",
        type: "success",
      });
    } catch (e: any) {
      showToast({ message: e?.message ?? "Üye durumu güncellenemedi.", type: "error" });
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
      showToast({ message: "Üye organizasyondan çıkarıldı.", type: "success" });
    } catch (e: any) {
      showToast({ message: e?.message ?? "Üye silinemedi.", type: "error" });
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
      showToast({ message: "Owner transfer başarıyla tamamlandı.", type: "success" });
      await refreshAll({ silent: true });
    } catch (e: any) {
      showToast({ message: e?.message ?? "Owner transfer başarısız oldu.", type: "error" });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <AppPage>
      <AppHero
        badge="Organizasyon alanı"
        title={heroTitle}
        description={heroSubtitle}
        right={<AppLinkButton href="/dashboard">Geri dön</AppLinkButton>}
      />

      <AppCard>
        {loading ? <div className="mb-4 text-sm text-gray-600">Yükleniyor...</div> : null}

        {pageError ? (
          <div className="mb-4 rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {pageError}
          </div>
        ) : null}

        <div className="mb-6 rounded-[28px] border border-gray-200 bg-gradient-to-r from-slate-50 via-white to-slate-50 p-5 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill label="Aktif organizasyon" active={!!org?.isActive} tone="green" />
                <StatusPill label="Owner" active={isOwner} tone="yellow" />
                <StatusPill label="Assistant" active={isAssistant} tone="blue" />
                <StatusPill label="Member" active={isMember} tone="neutral" />
                <StatusPill label="SuperAdmin" active={isSuperAdmin} tone="purple" />
              </div>

              <div>
                <div className="text-sm text-gray-500">Erişim ve yönetim özeti</div>
                <div className="mt-1 text-lg font-semibold tracking-tight text-gray-900">
                  {managementSummaryTitle}
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">
                  {managementSummaryDescription}
                </p>
              </div>
            </div>

            {canManageOrganization ? (
              <AppButton onClick={handleToggleActive} disabled={actionLoading || !org}>
                {actionLoading
                  ? "Güncelleniyor..."
                  : org?.isActive
                  ? "Organizasyonu pasife al"
                  : "Organizasyonu aktif et"}
              </AppButton>
            ) : null}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ReadonlyField label="Organization Id" value={id ?? ""} className="sm:col-span-2" mono />
          <ReadonlyField label="Organizasyon adı" value={org?.name ?? ""} />
          <ReadonlyField label="Vergi numarası" value={org?.taxNumber ?? ""} />
          <ReadonlyField label="Şehir" value={org?.city ?? ""} />
          <ReadonlyField label="İlçe" value={org?.district ?? ""} />
          <ReadonlyField label="Açıklama" value={org?.description ?? ""} className="sm:col-span-2" />
          <ReadonlyField label="Owner kullanıcı id" value={org?.ownerUserId ?? ""} mono />

          <div className="space-y-1 sm:col-span-2">
            <div className="text-sm text-gray-600">Katılım kodu</div>
            <div className="flex flex-col gap-2 rounded-3xl border border-gray-300 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="break-all font-mono text-sm text-gray-900">
                {org?.joinCode ?? ""}
              </div>

              <div className="flex gap-2">
                <AppButton onClick={handleCopyJoinCode}>Kodu kopyala</AppButton>

                {canManageOrganization ? (
                  <AppButton onClick={handleRegenerateJoinCode} disabled={actionLoading}>
                    Yeni kod üret
                  </AppButton>
                ) : null}
              </div>
            </div>
          </div>

          <ReadonlyField label="Oluşturulma tarihi" value={formatUtcDate(org?.createdAtUtc)} mono />
        </div>
      </AppCard>

      {canManageOrganization ? (
        <AppCard>
          <AppSectionHeader
            title="Bekleyen katılım talepleri"
            description="Katılım kodu ile gelen başvuruları onaylayabilir veya reddedebilirsin."
            right={
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
                Bekleyen talep: {pendingJoinRequests.length}
              </div>
            }
          />

          {joinRequestsLoading ? (
            <div className="text-sm text-gray-600">Talepler yükleniyor...</div>
          ) : pendingJoinRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/70 p-5 text-sm text-gray-600">
              Bekleyen katılım talebi bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingJoinRequests.map((request) => (
                <div key={request.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-3">
                      <UserInitialAvatar email={request.userEmail} />
                      <div>
                        <div className="text-sm font-semibold text-gray-900">{request.userEmail}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <JoinRequestStatusBadge status={request.status} />
                          <span className="text-xs text-gray-500">
                            Talep tarihi: {formatUtcDate(request.createdAtUtc)}
                          </span>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">UserId: {request.userId}</div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <AppButton
                        tone="success"
                        size="sm"
                        onClick={() => handleReviewJoinRequest(request.id, true)}
                        disabled={actionLoading}
                      >
                        Başvuruyu onayla
                      </AppButton>

                      <AppButton
                        tone="danger"
                        size="sm"
                        onClick={() => handleReviewJoinRequest(request.id, false)}
                        disabled={actionLoading}
                      >
                        Başvuruyu reddet
                      </AppButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AppCard>
      ) : null}

      {canManageOrganization ? (
        <AppCard>
          <AppSectionHeader
            title="Başvuru geçmişi"
            description="Sonuçlanmış başvuruları geçmiş olarak burada görebilirsin."
            right={
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-800">
                Toplam geçmiş kayıt: {reviewedJoinRequests.length}
              </div>
            }
          />

          {joinRequestsLoading ? (
            <div className="text-sm text-gray-600">Geçmiş yükleniyor...</div>
          ) : reviewedJoinRequests.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-gray-50/70 p-5 text-sm text-gray-600">
              Sonuçlanmış başvuru bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {reviewedJoinRequests.map((request) => (
                <div key={request.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <UserInitialAvatar email={request.userEmail} />
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{request.userEmail}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <JoinRequestStatusBadge status={request.status} />
                        <span className="text-xs text-gray-500">
                          Başvuru: {formatUtcDate(request.createdAtUtc)}
                        </span>
                        {request.reviewedAtUtc ? (
                          <span className="text-xs text-gray-500">
                            Sonuçlanma: {formatUtcDate(request.reviewedAtUtc)}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">UserId: {request.userId}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AppCard>
      ) : null}

      <AppCard>
        <AppSectionHeader
          title="Organizasyon üyeleri"
          description="Organizasyona kayıtlı kullanıcıları görüntüleyebilir ve yetkiliysen yönetebilirsin."
        />

        {canManageOrganization ? (
          <form
            onSubmit={handleAddMember}
            className="mb-6 grid gap-3 rounded-3xl border border-gray-200 bg-gray-50/80 p-4 sm:grid-cols-[1fr_180px_160px]"
          >
            <input
              type="email"
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="kullanici@email.com"
              className="rounded-3xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all duration-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100"
            />

            <select
              value={memberRole}
              onChange={(e) => setMemberRole(e.target.value as "Member" | "Assistant")}
              className="rounded-3xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all duration-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100"
            >
              <option value="Member">Member</option>
              <option value="Assistant">Assistant</option>
            </select>

            <AppButton type="submit" tone="primary" disabled={actionLoading}>
              Üye ekle
            </AppButton>
          </form>
        ) : null}

        {membersLoading ? (
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
                <div key={member.id} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{member.email}</div>
                      <div className="mt-1 text-xs text-gray-500">UserId: {member.userId}</div>
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
                            onClick={() => handleToggleRole(member)}
                            disabled={actionLoading}
                          >
                            {member.role === "Assistant" ? "Member yap" : "Assistant yap"}
                          </AppButton>

                          <AppButton
                            onClick={() => handleToggleMemberActive(member)}
                            disabled={actionLoading}
                          >
                            {member.isActive ? "Pasif et" : "Aktif et"}
                          </AppButton>

                          <AppButton
                            tone="warning"
                            onClick={() => handleTransferOwnership(member)}
                            disabled={actionLoading}
                          >
                            Owner yap
                          </AppButton>

                          <AppButton
                            tone="danger"
                            onClick={() => handleDeleteMember(member)}
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
    </AppPage>
  );
}