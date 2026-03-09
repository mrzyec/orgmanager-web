"use client";

export function MemberRoleBadge({ role }: { role: string }) {
  const normalized = role.toLowerCase();

  if (normalized === "owner") {
    return (
      <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700">
        Owner
      </span>
    );
  }

  if (normalized === "assistant") {
    return (
      <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
        Assistant
      </span>
    );
  }

  return (
    <span className="rounded-full border border-gray-200 bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
      Member
    </span>
  );
}

export function JoinRequestStatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();

  if (normalized === "pending") {
    return (
      <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
        Beklemede
      </span>
    );
  }

  if (normalized === "approved") {
    return (
      <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
        Onaylandı
      </span>
    );
  }

  if (normalized === "rejected") {
    return (
      <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700">
        Reddedildi
      </span>
    );
  }

  return (
    <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      {status}
    </span>
  );
}

export function StatusPill({
  label,
  active,
  tone = "neutral",
}: {
  label: string;
  active: boolean;
  tone?: "neutral" | "green" | "blue" | "yellow" | "purple";
}) {
  if (!active) {
    return (
      <span className="rounded-full border border-gray-200 bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
        {label}
      </span>
    );
  }

  if (tone === "green") {
    return (
      <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 shadow-sm">
        {label}
      </span>
    );
  }

  if (tone === "blue") {
    return (
      <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm">
        {label}
      </span>
    );
  }

  if (tone === "yellow") {
    return (
      <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs font-semibold text-yellow-700 shadow-sm">
        {label}
      </span>
    );
  }

  if (tone === "purple") {
    return (
      <span className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm">
        {label}
      </span>
    );
  }

  return (
    <span className="rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm">
      {label}
    </span>
  );
}