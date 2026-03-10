"use client";

import { AppButton, AppLinkButton } from "@/components/ui";

type AppNavbarProps = {
  email?: string | null;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

function UserBadge({ email }: { email?: string | null }) {
  return (
    <div className="inline-flex h-[46px] max-w-full items-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm">
      <span className="mr-2 shrink-0 font-medium text-slate-500">Kullanıcı:</span>
      <span className="font-semibold text-slate-900">{email ?? "-"}</span>
    </div>
  );
}

export function AppNavbar({
  email,
  title = "OrgManager",
  subtitle = "Organizasyon yönetim alanı",
  actions,
}: AppNavbarProps) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-gradient-to-r from-slate-50 via-white to-blue-50/40 p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium text-slate-500">OrgManager</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            {title}
          </div>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <UserBadge email={email} />

          {actions ? (
            <div className="flex flex-wrap items-center gap-3">
              {actions}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function AppNavbarDashboardActions({
  onLogout,
  logoutLoading,
}: {
  onLogout: () => void;
  logoutLoading: boolean;
}) {
  return (
    <>
      <AppLinkButton href="/join">Başvur</AppLinkButton>
      <AppLinkButton href="/organizations/new" tone="primary">
        Yeni organizasyon
      </AppLinkButton>
      <AppButton onClick={onLogout} disabled={logoutLoading}>
        {logoutLoading ? "Çıkış yapılıyor..." : "Çıkış yap"}
      </AppButton>
    </>
  );
}

export function AppNavbarDetailsActions({
  onToggleActive,
  actionLoading,
  isActive,
  canManageOrganization,
}: {
  onToggleActive: () => void;
  actionLoading: boolean;
  isActive?: boolean;
  canManageOrganization: boolean;
}) {
  return (
    <>
      <AppLinkButton href="/dashboard">Geri dön</AppLinkButton>

      {canManageOrganization ? (
        <AppButton onClick={onToggleActive} disabled={actionLoading}>
          {actionLoading
            ? "Güncelleniyor..."
            : isActive
            ? "Organizasyonu pasife al"
            : "Organizasyonu aktif et"}
        </AppButton>
      ) : null}
    </>
  );
}