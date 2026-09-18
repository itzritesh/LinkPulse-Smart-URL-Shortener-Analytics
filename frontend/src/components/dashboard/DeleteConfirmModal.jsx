import React, { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import Button from "@/components/common/Button";

export default function DeleteConfirmModal({
  isOpen,
  link,
  onClose,
  onConfirm,
  isDeleting = false,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && !isDeleting) onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, isDeleting, onClose]);

  if (!isOpen || !link) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-canvas/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={isDeleting ? undefined : onClose}
      />

      {/* Dialog Card */}
      <div className="relative w-full max-w-md rounded-2xl bg-surface-card border border-rose-900/40 shadow-2xl p-6 sm:p-7 z-10 animate-scale-in space-y-5">
        {/* Header with Alert Icon */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white tracking-tight">
                Delete Short Link
              </h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to permanently remove this link?
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-canvas transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Link Preview Card */}
        <div className="p-3.5 rounded-xl bg-surface-canvas border border-surface-border text-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="font-mono font-medium text-brand-300 text-sm">
              /{link.short_code}
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              {(link.clicks ?? link.click_count ?? 0).toLocaleString()} clicks
            </span>
          </div>
          <p className="text-slate-400 truncate text-[11px]">
            {link.original_url}
          </p>
        </div>

        {/* Warning Callout */}
        <p className="text-xs text-slate-400 leading-relaxed">
          This action <strong className="text-slate-200">cannot be undone</strong>. Incoming redirect traffic will immediately return a 404/410 response, and all historical click metrics for this link will be deleted.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => onConfirm(link.id)}
            disabled={isDeleting}
            isLoading={isDeleting}
            className="flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Short Link</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
