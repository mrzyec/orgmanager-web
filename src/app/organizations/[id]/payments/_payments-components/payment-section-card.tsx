"use client";

import type { ReactNode } from "react";

type PaymentSectionCardProps = {
  title: string;
  description?: string;
  children: ReactNode;
  rightSlot?: ReactNode;
};

export default function PaymentSectionCard({
  title,
  description,
  children,
  rightSlot,
}: PaymentSectionCardProps) {
  return (
    <div
      className="rounded-[28px] border shadow-sm"
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
      }}
    >
      <div
        className="flex flex-col gap-3 border-b px-5 py-4 md:flex-row md:items-center md:justify-between"
        style={{ borderColor: "var(--border)" }}
      >
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text)" }}>
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {description}
            </p>
          ) : null}
        </div>
        {rightSlot}
      </div>

      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}
