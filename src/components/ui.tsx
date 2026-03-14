"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type ButtonTone = "primary" | "secondary" | "success" | "danger" | "warning";
type ButtonSize = "sm" | "md";

function getButtonToneStyle(tone: ButtonTone) {
  switch (tone) {
    case "primary":
      return {
        borderColor: "var(--primary)",
        backgroundColor: "var(--primary)",
        color: "var(--primary-contrast)",
      };
    case "success":
      return {
        borderColor: "var(--success-border)",
        backgroundColor: "var(--success-bg)",
        color: "var(--success-text)",
      };
    case "danger":
      return {
        borderColor: "var(--danger-border)",
        backgroundColor: "var(--danger-bg)",
        color: "var(--danger-text)",
      };
    case "warning":
      return {
        borderColor: "var(--warning-border)",
        backgroundColor: "var(--warning-bg)",
        color: "var(--warning-text)",
      };
    default:
      return {
        borderColor: "var(--border)",
        backgroundColor: "var(--surface-solid)",
        color: "var(--text)",
      };
  }
}

function getButtonSizeClass(size: ButtonSize) {
  return size === "sm"
    ? "rounded-2xl px-3 py-2 text-xs font-medium"
    : "rounded-2xl px-4 py-2.5 text-sm font-medium";
}

function getButtonHoverClass(tone: ButtonTone) {
  switch (tone) {
    case "primary":
      return "hover:brightness-110";
    case "success":
    case "danger":
    case "warning":
      return "hover:brightness-[0.98]";
    default:
      return "hover:brightness-[0.98]";
  }
}

function getButtonBaseClass(tone: ButtonTone, size: ButtonSize) {
  return [
    "inline-flex items-center justify-center shadow-sm transition-all duration-200",
    "hover:shadow-md hover:-translate-y-0.5 active:translate-y-[1px] active:scale-[0.99]",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "border",
    getButtonSizeClass(size),
    getButtonHoverClass(tone),
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
      style={getButtonToneStyle(tone)}
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
      style={getButtonToneStyle(tone)}
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
    <main
      className="min-h-screen w-full px-4 py-6 lg:px-6 xl:px-8"
      style={{ background: "var(--app-bg)" }}
    >
      <div className="w-full space-y-6">{children}</div>
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
        <div
          className="inline-flex rounded-full border px-3 py-1 text-xs font-medium shadow-sm"
          style={{
            borderColor: "var(--border)",
            backgroundColor: "var(--surface-solid)",
            color: "var(--text-muted)",
          }}
        >
          {badge}
        </div>
        <h1
          className="mt-3 text-3xl font-semibold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          {title}
        </h1>
        <p
          className="mt-2 max-w-2xl text-sm leading-6"
          style={{ color: "var(--text-muted)" }}
        >
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
      className={`rounded-[30px] border p-6 ${className}`.trim()}
      style={{
        borderColor: "var(--border)",
        backgroundColor: "var(--surface)",
        boxShadow: "var(--shadow-card)",
      }}
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
        <h2
          className="text-xl font-semibold tracking-tight"
          style={{ color: "var(--text)" }}
        >
          {title}
        </h2>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {description}
        </p>
      </div>

      {right}
    </div>
  );
}