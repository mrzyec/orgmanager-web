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
    <div
      className="inline-flex h-[46px] max-w-full items-center rounded-2xl border px-4 py-3 text-sm shadow-sm"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface-solid)",
        color: "var(--text)",
      }}
    >
      <span className="mr-2 shrink-0 font-medium" style={{ color: "var(--text-muted)" }}>
        Kullanıcı:
      </span>
      <span className="font-semibold" style={{ color: "var(--text)" }}>
        {email ?? "-"}
      </span>
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
    <div
      className="rounded-[28px] border p-5 shadow-sm"
      style={{
        borderColor: "var(--border)",
        background: `linear-gradient(to right, var(--navbar-start), var(--navbar-mid), var(--navbar-end))`,
      }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
            OrgManager
          </div>
          <div
            className="mt-1 text-2xl font-semibold tracking-tight"
            style={{ color: "var(--text)" }}
          >
            {title}
          </div>
          <p
            className="mt-2 max-w-3xl text-sm leading-6"
            style={{ color: "var(--text-muted)" }}
          >
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
