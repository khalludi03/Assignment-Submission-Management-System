"use client";

import { useEffect } from "react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onCancel}
    >
      <div className="card w-full max-w-sm p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-base font-semibold text-zinc-50">{title}</h3>
        <p className="mt-2 text-sm text-zinc-400">{message}</p>
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} disabled={busy} className="btn btn-secondary">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={busy} className="btn btn-danger">
            {busy ? (
              <>
                <span className="spinner" />
                Working...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
