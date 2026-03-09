"use client";

import type { ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import type { InputHTMLAttributes } from "react";

const fieldBaseClass =
  "w-full rounded-3xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition-all duration-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 disabled:cursor-not-allowed disabled:opacity-60";

export function AppField({
  label,
  children,
  className = "",
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block space-y-1 ${className}`.trim()}>
      <div className="text-sm text-gray-600">{label}</div>
      {children}
    </label>
  );
}

export function AppInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;

  return <input {...rest} className={`${fieldBaseClass} ${className}`.trim()} />;
}

export function AppTextarea(
  props: TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const { className = "", ...rest } = props;

  return (
    <textarea {...rest} className={`${fieldBaseClass} ${className}`.trim()} />
  );
}

export function AppSelect(
  props: SelectHTMLAttributes<HTMLSelectElement>
) {
  const { className = "", children, ...rest } = props;

  return (
    <select {...rest} className={`${fieldBaseClass} ${className}`.trim()}>
      {children}
    </select>
  );
}