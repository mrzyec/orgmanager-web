"use client";

import { useEffect, useMemo, useState } from "react";

export type ToastType = "success" | "error" | "info";

type ToastProps = {
  message: string;
  type?: ToastType;
  onClose: () => void;
  durationMs?: number;
};

function ToastIcon({ type }: { type: ToastType }) {
  if (type === "success") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (type === "error") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4">
        <path d="M12 8v5" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="0.7" fill="currentColor" stroke="none" />
        <path
          d="M10.29 3.86 1.82 18a2 2 0 0 0 1.72 3h16.92a2 2 0 0 0 1.72-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 10v6" strokeLinecap="round" />
      <circle cx="12" cy="7.5" r="0.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function Toast({
  message,
  type = "info",
  onClose,
  durationMs = 5000,
}: ToastProps) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    setProgress(100);

    const startedAt = Date.now();

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      const next = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(next);
    }, 24);

    return () => {
      window.clearInterval(interval);
    };
  }, [durationMs, message]);

  const ui = useMemo(() => {
    if (type === "success") {
      return {
        title: "Başarılı",
        wrapper:
          "border-emerald-200/80 bg-emerald-50/95 text-emerald-950 shadow-emerald-200/60",
        iconWrap: "bg-emerald-600 text-white ring-emerald-200",
        progress: "bg-emerald-600",
      };
    }

    if (type === "error") {
      return {
        title: "Hata",
        wrapper:
          "border-red-200/80 bg-red-50/95 text-red-950 shadow-red-200/60",
        iconWrap: "bg-red-600 text-white ring-red-200",
        progress: "bg-red-600",
      };
    }

    return {
      title: "Bilgi",
      wrapper:
        "border-sky-200/80 bg-sky-50/95 text-sky-950 shadow-sky-200/60",
      iconWrap: "bg-sky-600 text-white ring-sky-200",
      progress: "bg-sky-600",
    };
  }, [type]);

  return (
    <div
      className={`w-[420px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border backdrop-blur-md shadow-2xl ${ui.wrapper}`}
    >
      <div className="flex items-start gap-3 px-4 py-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ring-4 ${ui.iconWrap}`}
        >
          <ToastIcon type={type} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold tracking-tight">{ui.title}</div>
          <div className="mt-1 text-sm leading-6">{message}</div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-current/80 transition hover:bg-black/5 hover:text-current"
        >
          Kapat
        </button>
      </div>

      <div className="h-1.5 w-full bg-black/10">
        <div
          className={`h-full rounded-r-full transition-[width] duration-75 ease-linear ${ui.progress}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}