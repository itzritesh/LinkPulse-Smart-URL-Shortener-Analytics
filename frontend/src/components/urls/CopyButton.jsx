import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/context/ToastContext";

export default function CopyButton({
  text,
  label = null,
  size = "sm",
  variant = "ghost",
  className = "",
}) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.info("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const sizeClasses = {
    sm: "p-1.5 text-xs gap-1.5 rounded-lg",
    md: "px-3 py-1.5 text-xs gap-2 rounded-xl",
  }[size] || "p-1.5 text-xs gap-1.5 rounded-lg";

  const variantClasses = {
    ghost: "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60",
    primary: "bg-brand-500 hover:bg-brand-400 text-white shadow-sm",
    outline: "bg-transparent border border-slate-700 hover:border-brand-500/60 text-slate-300 hover:text-white",
  }[variant] || "bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 ${variantClasses} ${sizeClasses} ${className}`}
      title="Copy to clipboard"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          {label && <span className="text-emerald-300">Copied!</span>}
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5 shrink-0" />
          {label && <span>{label}</span>}
        </>
      )}
    </button>
  );
}
