import React from "react";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary:
    "bg-brand-600 hover:bg-brand-500 active:bg-brand-700 text-white font-medium border border-brand-500/60 shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] shadow-brand-950/50",
  secondary:
    "bg-[#141b2d] hover:bg-[#1a233b] active:bg-[#111728] text-slate-200 border border-[#1c253b] hover:border-slate-600 shadow-sm",
  destructive:
    "bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-400 border border-rose-500/25 shadow-sm",
  outline:
    "bg-transparent border border-[#1c253b] hover:border-slate-600 text-slate-300 hover:text-white hover:bg-[#141b2d]",
  ghost:
    "bg-transparent hover:bg-[#141b2d] active:bg-[#0f1422] text-slate-400 hover:text-slate-200",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  className = "",
  type = "button",
  ...props
}) {
  const sizeClasses = {
    xs: "px-2.5 py-1 text-xs rounded-lg gap-1.5 h-7",
    sm: "px-3 py-1.5 text-xs rounded-xl gap-1.5 h-8.5 font-medium",
    md: "px-4 py-2 text-sm rounded-xl gap-2 h-10 font-medium",
    lg: "px-5 py-2.5 text-sm rounded-xl gap-2.5 h-11 font-medium",
    icon: "p-2 rounded-xl h-9 w-9 justify-center",
  }[size] || "px-4 py-2 text-sm rounded-xl gap-2 h-10 font-medium";

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#090d16] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer select-none ${VARIANTS[variant] || VARIANTS.primary} ${sizeClasses} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
      {children}
    </button>
  );
}

