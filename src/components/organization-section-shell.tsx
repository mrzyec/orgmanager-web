"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { AppCard, AppLinkButton, AppPage } from "@/components/ui";
import { AppNavbar } from "@/components/app-navbar";
import OrganizationSidebarLayout from "@/components/organization-sidebar-layout";
import { StatusPill } from "@/components/badges";
import type {
  MeResponse,
  OrganizationDto,
  OrganizationMemberDto,
} from "@/lib/api";

function HoverInfoPill({
  label,
  tone,
  tooltipTitle,
  tooltipDescription,
}: {
  label: string;
  tone: "green" | "yellow" | "blue" | "neutral" | "purple";
  tooltipTitle: string;
  tooltipDescription: string;
}) {
  const toneClass =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700 shadow-emerald-100"
      : tone === "yellow"
      ? "border-amber-200 bg-amber-50 text-amber-700 shadow-amber-100"
      : tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-700 shadow-blue-100"
      : tone === "purple"
      ? "border-purple-200 bg-purple-50 text-purple-700 shadow-purple-100"
      : "border-slate-200 bg-slate-100 text-slate-700 shadow-slate-100";

  return (
    <div className="group relative">
      <div
        className={`inline-flex h-[46px] items-center rounded-2xl border px-4 py-3 text-sm font-semibold shadow-sm transition ${toneClass}`}
      >
        {label}
      </div>

      <div className="pointer-events-none absolute left-0 top-[54px] z-30 w-72 rounded-2xl border border-slate-200 bg-white p-4 text-left opacity-0 shadow-xl transition duration-200 group-hover:opacity-100">
        <div className="text-sm font-semibold text-slate-900">{tooltipTitle}</div>
        <div className="mt-1 text-sm leading-6 text-slate-600">
          {tooltipDescription}
        </div>
      </div>
    </div>
  );
}

type Props = {
  organizationId: string;
  org: OrganizationDto | null;
  me: MeResponse | null;
  members?: OrganizationMemberDto[];
  canManageOrganization: boolean;
  subtitle: string;
  children: React.ReactNode;
};

export default function OrganizationSectionShell({
  organizationId,
  org,
  me,
  members = [],
  canManageOrganization,
  subtitle,
  children,
}: Props) {
  const pathname = usePathname();

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

  const currentRoleLabel = useMemo(() => {
    if (isOwner) return "Owner";
    if (isAssistant) return "Assistant";
    if (isMember) return "Member";
    return "İzleyici";
  }, [isAssistant, isMember, isOwner]);

  const currentRoleTone = useMemo(() => {
    if (isOwner) return "yellow" as const;
    if (isAssistant) return "blue" as const;
    if (isMember) return "neutral" as const;
    return "neutral" as const;
  }, [isAssistant, isMember, isOwner]);

  const currentRoleTooltipTitle = useMemo(() => {
    if (isSuperAdmin && isOwner) return "Owner + SuperAdmin";
    if (isSuperAdmin) return "SuperAdmin erişimi";
    if (isOwner) return "Owner yetkisi";
    if (isAssistant) return "Assistant rolü";
    if (isMember) return "Member rolü";
    return "İzleme erişimi";
  }, [isAssistant, isMember, isOwner, isSuperAdmin]);

  const currentRoleTooltipDescription = useMemo(() => {
    if (isSuperAdmin && isOwner) {
      return "Bu organizasyonda owner olarak işlem yapabilir, ayrıca SuperAdmin erişimin sayesinde yönetim alanlarının tamamına ulaşabilirsin.";
    }

    if (isSuperAdmin) {
      return "Bu organizasyonda SuperAdmin erişimin aktif. Ayarlar, ödemeler, üyeler ve başvurular üzerinde yönetim yetkin bulunuyor.";
    }

    if (isOwner) {
      return "Owner olarak organizasyon yönetim alanlarına erişebilirsin.";
    }

    if (isAssistant) {
      return "Assistant rolünde sana açık olan alanları görüntüleyebilir ve kural bazlı işlemleri kullanabilirsin.";
    }

    if (isMember) {
      return "Member rolünde temel organizasyon bilgilerini görüntüleyebilirsin.";
    }

    return "Bu organizasyona ait temel bilgileri görüntüleyebilirsin.";
  }, [isAssistant, isMember, isOwner, isSuperAdmin]);

  const basePath = `/organizations/${organizationId}`;

  const sidebarItems = [
    {
      key: "overview",
      label: "Genel bilgiler",
      href: basePath,
      description: "Temel organizasyon ve sistem alanları",
      isActive: pathname === basePath,
    },
    {
      key: "members",
      label: "Üyeler",
      href: `${basePath}/members`,
      description: "Üye listesi ve yönetim işlemleri",
      isActive: pathname === `${basePath}/members`,
    },
    {
      key: "requests",
      label: "Başvurular",
      href: `${basePath}/requests`,
      description: "Bekleyen ve sonuçlanan talepler",
      isActive: pathname === `${basePath}/requests`,
    },
    {
      key: "payments",
      label: "Aidat / ödemeler",
      href: `${basePath}/payments`,
      description: "Aidat ayarı ve üye ödeme durumu",
      isActive: pathname === `${basePath}/payments`,
    },
    {
      key: "settings",
      label: "Ayarlar",
      href: `${basePath}/settings`,
      description: "Join code ve tehlikeli işlemler",
      isActive: pathname === `${basePath}/settings`,
    },
  ];

  return (
    <AppPage>
      <AppNavbar
        email={me?.email}
        title={org?.name ?? "Organizasyon detayları"}
        subtitle={subtitle}
        actions={<AppLinkButton href="/dashboard">Geri dön</AppLinkButton>}
      />

      <OrganizationSidebarLayout
        title={org?.name ?? "Organizasyon"}
        subtitle="Bu menü ile organizasyon alanlarını ayrı sayfalarda daha sade şekilde yönetebilirsin."
        items={sidebarItems}
      >
        <AppCard>
          <div className="flex flex-wrap items-center gap-2">
            <HoverInfoPill
              label={org?.isActive ? "Aktif organizasyon" : "Pasif organizasyon"}
              tone="green"
              tooltipTitle="Organizasyon durumu"
              tooltipDescription={
                org?.isActive
                  ? "Bu organizasyon şu anda aktif durumda görünüyor."
                  : "Bu organizasyon şu anda pasif durumda görünüyor."
              }
            />

            <HoverInfoPill
              label={currentRoleLabel}
              tone={currentRoleTone}
              tooltipTitle={currentRoleTooltipTitle}
              tooltipDescription={currentRoleTooltipDescription}
            />

            {isSuperAdmin ? (
              <StatusPill label="SuperAdmin" active tone="purple" />
            ) : null}
          </div>
        </AppCard>

        {children}
      </OrganizationSidebarLayout>
    </AppPage>
  );
}