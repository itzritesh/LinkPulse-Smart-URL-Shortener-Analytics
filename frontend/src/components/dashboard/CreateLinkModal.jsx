import React, { useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import UrlForm from "@/components/urls/UrlForm";

export default function CreateLinkModal({ isOpen, onClose, onLinkCreated }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-surface-canvas/80 backdrop-blur-md transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl rounded-2xl bg-surface-card border border-surface-border shadow-2xl p-6 sm:p-7 z-10 animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-surface-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand-500/15 border border-brand-500/25 flex items-center justify-center text-brand-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Create Short Link
              </h2>
              <p className="text-xs text-slate-400">
                Shorten target URL with custom vanity slug and optional expiration.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-canvas transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Embedded Form */}
        <UrlForm
          onLinkCreated={(newLink) => {
            if (onLinkCreated) onLinkCreated(newLink);
            onClose();
          }}
        />
      </div>
    </div>
  );
}
