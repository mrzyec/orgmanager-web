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
    <div className="rounded-[28px] border border-slate-200 bg-white/95 shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {description ? (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          ) : null}
        </div>
        {rightSlot}
      </div>

      <div className="p-4 md:p-5">{children}</div>
    </div>
  );
}