"use client";

import type { ReactNode } from "react";

type AdminDialogProps = {
  title: string;
  children: ReactNode;
  variant?: "default" | "success" | "error";
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onClose: () => void;
  loading?: boolean;
};

export function AdminDialog({
  title,
  children,
  variant = "default",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  onConfirm,
  onClose,
  loading = false,
}: AdminDialogProps) {
  const titleColor =
    variant === "success"
      ? "text-emerald-800"
      : variant === "error"
        ? "text-red-800"
        : "text-[var(--brand)]";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-dialog-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border-soft)] bg-white p-6 shadow-xl">
        <h3 id="admin-dialog-title" className={`text-lg font-semibold ${titleColor}`}>
          {title}
        </h3>
        <div className="mt-3 text-sm text-[var(--muted)]">{children}</div>
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          {onConfirm ? (
            <>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="brand-btn-secondary brand-btn-sm rounded-lg px-4 py-2"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="brand-btn brand-btn-sm rounded-lg px-4 py-2"
              >
                {loading ? "Enregistrement…" : confirmLabel}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="brand-btn brand-btn-sm rounded-lg px-4 py-2"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
