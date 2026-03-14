"use client";

import Link from "next/link";

export type OrganizationSidebarItem = {
  key: string;
  label: string;
  href: string;
  description?: string;
  isActive?: boolean;
};

type OrganizationSidebarLayoutProps = {
  title: string;
  subtitle?: string;
  items: OrganizationSidebarItem[];
  children: React.ReactNode;
};

export default function OrganizationSidebarLayout({
  title,
  subtitle,
  items,
  children,
}: OrganizationSidebarLayoutProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div
          className="rounded-[28px] border p-5 shadow-sm"
          style={{
            borderColor: "var(--border)",
            background: `linear-gradient(to bottom, var(--sidebar-start), var(--sidebar-mid), var(--sidebar-end))`,
          }}
        >
          <div className="mb-5">
            <div
              className="text-sm font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              Organizasyon menüsü
            </div>

            <div
              className="mt-1 text-[22px] font-semibold tracking-tight"
              style={{ color: "var(--text)" }}
            >
              {title}
            </div>

            {subtitle ? (
              <p
                className="mt-2 text-sm leading-8"
                style={{ color: "var(--text-muted)" }}
              >
                {subtitle}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                prefetch
                className={`block rounded-2xl border px-4 py-4 transition-all duration-200 ${
                  item.isActive
                    ? "shadow-md"
                    : "hover:-translate-y-0.5 hover:shadow-sm"
                }`}
                style={
                  item.isActive
                    ? {
                        borderColor: "var(--primary)",
                        backgroundColor: "var(--primary)",
                        color: "var(--primary-contrast)",
                      }
                    : {
                        borderColor: "var(--border)",
                        backgroundColor: "var(--surface-solid)",
                        color: "var(--text)",
                      }
                }
              >
                <div className="text-sm font-semibold">{item.label}</div>

                {item.description ? (
                  <div
                    className="mt-1 text-xs leading-6"
                    style={{
                      color: item.isActive
                        ? "var(--text-on-dark-muted)"
                        : "var(--text-muted)",
                    }}
                  >
                    {item.description}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>

          <div
            className="mt-5 rounded-2xl border border-dashed px-4 py-4"
            style={{
              borderColor: "var(--border)",
              backgroundColor: "var(--surface-soft)",
            }}
          >
            <div
              className="text-xs font-semibold uppercase tracking-wide"
              style={{ color: "var(--text-muted)" }}
            >
              Sonraki adım
            </div>

            <div
              className="mt-1 text-sm leading-7"
              style={{ color: "var(--text-muted)" }}
            >
              Bu menü yapısını ileride ek modüllerle genişletebiliriz.
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}