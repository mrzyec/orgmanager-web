"use client";

type ActionConfirmModalProps = {
  open: boolean;
  title: string;
  description: string;
  warningText?: string;
  confirmText?: string;
  cancelText?: string;
  confirmTone?: "default" | "danger";
  isSubmitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ActionConfirmModal({
  open,
  title,
  description,
  warningText,
  confirmText = "Onayla",
  cancelText = "Vazgeç",
  confirmTone = "default",
  isSubmitting = false,
  onCancel,
  onConfirm,
}: ActionConfirmModalProps) {
  if (!open) return null;

  const confirmButtonClass =
    confirmTone === "danger"
      ? "rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:opacity-60"
      : "rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 p-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4">
          <div className="text-lg font-semibold text-slate-900">{title}</div>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </div>

        {warningText ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {warningText}
          </div>
        ) : null}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {cancelText}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting}
            className={confirmButtonClass}
          >
            {isSubmitting ? "İşleniyor..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}