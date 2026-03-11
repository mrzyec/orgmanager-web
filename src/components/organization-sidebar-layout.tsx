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
    <div className="grid gap-6 xl:grid-cols-[250px_minmax(0,1fr)]">
      <aside className="xl:sticky xl:top-6 xl:self-start">
        <div className="rounded-[28px] border border-slate-200 bg-gradient-to-b from-slate-50 via-white to-slate-50 p-5 shadow-sm">
          <div className="mb-5">
            <div className="text-sm font-medium text-slate-500">
              Organizasyon menüsü
            </div>

            <div className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
              {title}
            </div>

            {subtitle ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">
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
                className={`block rounded-2xl border px-4 py-3 transition-all duration-200 ${
                  item.isActive
                    ? "border-slate-900 bg-slate-900 text-white shadow-md"
                    : "border-slate-200 bg-white text-slate-800 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                }`}
              >
                <div className="text-sm font-semibold">{item.label}</div>

                {item.description ? (
                  <div
                    className={`mt-1 text-xs leading-5 ${
                      item.isActive ? "text-slate-200" : "text-slate-500"
                    }`}
                  >
                    {item.description}
                  </div>
                ) : null}
              </Link>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Sonraki adım
            </div>

            <div className="mt-1 text-sm leading-6 text-slate-600">
              Bu menü yapısını ileride ek modüllerle genişletebiliriz.
            </div>
          </div>
        </div>
      </aside>

      <div className="min-w-0 space-y-6">{children}</div>
    </div>
  );
}