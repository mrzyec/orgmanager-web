"use client";

type ReadonlyFieldProps = {
  label: string;
  value: string;
  className?: string;
  mono?: boolean;
};

export function ReadonlyField({
  label,
  value,
  className = "",
  mono = false,
}: ReadonlyFieldProps) {
  return (
    <label className={`space-y-1 ${className}`}>
      <div className="text-sm text-gray-600">{label}</div>
      <input
        className={`w-full rounded-3xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none read-only:bg-white read-only:text-gray-900 ${
          mono ? "font-mono" : ""
        }`}
        value={value}
        readOnly
      />
    </label>
  );
}

export function UserInitialAvatar({ email }: { email: string }) {
  const letter = (email?.trim()?.[0] ?? "?").toUpperCase();

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gradient-to-br from-gray-100 to-white text-sm font-semibold text-gray-700 shadow-sm">
      {letter}
    </div>
  );
}