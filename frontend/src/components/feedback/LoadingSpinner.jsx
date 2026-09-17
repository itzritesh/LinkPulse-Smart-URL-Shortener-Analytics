import React from "react";
import { Loader2 } from "lucide-react";

export default function LoadingSpinner({ size = "md", text = "" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-10 h-10",
  }[size] || "w-6 h-6";

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-4">
      <Loader2 className={`${sizeClasses} text-brand-400 animate-spin`} />
      {text && <p className="text-xs text-slate-400 font-medium">{text}</p>}
    </div>
  );
}
