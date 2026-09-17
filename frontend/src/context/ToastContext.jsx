import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "info", duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast = { id, message, type };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => addToast(msg, "success", duration),
    error: (msg, duration) => addToast(msg, "error", duration),
    info: (msg, duration) => addToast(msg, "info", duration),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}

      {/* Modern Floating Toast Container (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-center gap-3 p-3.5 rounded-xl shadow-2xl border backdrop-blur-xl transition-all duration-200 animate-fade-in ${
                isSuccess
                  ? "bg-[#0c1614]/95 border-emerald-500/25 text-emerald-100"
                  : isError
                  ? "bg-[#170e13]/95 border-rose-500/25 text-rose-100"
                  : "bg-[#0f1422]/95 border-[#1c253b] text-slate-100"
              }`}
            >
              <div className="shrink-0">
                {isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : isError ? (
                  <AlertCircle className="w-4 h-4 text-rose-400" />
                ) : (
                  <Info className="w-4 h-4 text-brand-400" />
                )}
              </div>

              <div className="flex-1 text-xs font-medium leading-snug">
                {t.message}
              </div>

              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                aria-label="Dismiss notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
