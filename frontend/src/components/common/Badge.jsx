import React from "react";

const VARIANTS = {
  success: {
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    dot: "bg-emerald-400",
  },
  warning: {
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    dot: "bg-amber-400",
  },
  error: {
    badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    dot: "bg-rose-400",
  },
  info: {
    badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    dot: "bg-cyan-400",
  },
  brand: {
    badge: "bg-brand-500/10 text-brand-300 border-brand-500/25",
    dot: "bg-brand-400",
  },
  neutral: {
    badge: "bg-[#141b2d] text-slate-300 border-[#1c253b]",
    dot: "bg-slate-400",
  },
};

export default function Badge({
  children,
  variant = "neutral",
  dot = false,
  pulse = false,
  className = "",
}) {
  const conf = VARIANTS[variant] || VARIANTS.neutral;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${conf.badge} ${className}`}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5 shrink-0">
          {pulse && (
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${conf.dot}`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${conf.dot}`} />
        </span>
      )}
      {children}
    </span>
  );
}

