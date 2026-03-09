"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type ButtonTone = "primary" | "secondary" | "success" | "danger" | "warning";
type ButtonSize = "sm" | "md";

function getButtonToneClass(tone: ButtonTone) {
  switch (tone) {
    case "primary":
      return "border-black bg-black text-white hover:border-gray-700 hover:bg-gray-900";
    case "success":
      return "border-green-300 bg-green-50 text-green-700 hover:border-green-400 hover:bg-green-100";
    case "danger":
      return "border-red-300 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100";
    case "warning":
      return "border-yellow-300 bg-yellow-50 text-yellow-700 hover:border-yellow-400 hover:bg-yellow-100";
    default:
      return "border-gray-300 bg-white text-gray-800 hover:border-gray-500 hover:bg-gray-50";
  }
}

function getButtonSizeClass(size: ButtonSize) {
  return size === "sm"
    ? "rounded-2xl px-3 py-2 text-xs font-medium"
    : "rounded-2xl px-4 py-2.5 text-sm font-medium";
}

function getButtonBaseClass(tone: ButtonTone, size: ButtonSize) {
  return [
    "inline-flex items-center justify-center shadow-sm transition-all duration-200",
    "hover:shadow-md hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.99]",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "border",
    getButtonToneClass(tone),
    getButtonSizeClass(size),
  ].join(" ");
}

type AppButtonProps = {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  tone?: ButtonTone;
  size?: ButtonSize;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
};

export function AppButton({
  children,
  type = "button",
  tone = "secondary",
  size = "md",
  disabled,
  onClick,
  className = "",
}: AppButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${getButtonBaseClass(tone, size)} ${className}`.trim()}
    >
      {children}
    </button>
  );
}

type AppLinkButtonProps = {
  href: string;
  children: ReactNode;
  tone?: ButtonTone;
  size?: ButtonSize;
  className?: string;
};

export function AppLinkButton({
  href,
  children,
  tone = "secondary",
  size = "md",
  className = "",
}: AppLinkButtonProps) {
  return (
    <Link
      href={href}
      className={`${getButtonBaseClass(tone, size)} ${className}`.trim()}
    >
      {children}
    </Link>
  );
}

export function AppPage({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f8fafc,#eef2f7)] px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">{children}</div>
    </main>
  );
}

export function AppHero({
  badge,
  title,
  description,
  right,
}: {
  badge: string;
  title: string;
  description: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-sm">
          {badge}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-gray-900">
          {title}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
          {description}
        </p>
      </div>

      {right}
    </div>
  );
}

export function AppCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-[30px] border border-white/70 bg-white/90 p-6 shadow-[0_12px_34px_rgba(15,23,42,0.07)] backdrop-blur ${className}`.trim()}
    >
      {children}
    </section>
  );
}

export function AppSectionHeader({
  title,
  description,
  right,
}: {
  title: string;
  description: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-gray-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>

      {right}
    </div>
  );
}