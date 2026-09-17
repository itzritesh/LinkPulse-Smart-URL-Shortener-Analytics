import React from "react";

export default function StatusIndicator({ status = "offline", showLabel = true, label = null }) {
  const configs = {
    healthy: {
      color: "bg-emerald-400",
      ping: "bg-emerald-400",
      text: "Online",
      textColor: "text-emerald-400",
    },
    degraded: {
      color: "bg-amber-400",
      ping: "bg-amber-400",
      text: "Degraded",
      textColor: "text-amber-400",
    },
    offline: {
      color: "bg-rose-500",
      ping: "bg-rose-500",
      text: "Offline",
      textColor: "text-rose-400",
    },
  };

  const current = configs[status] || configs.offline;
  const displayLabel = label || current.text;

  return (
    <div className="inline-flex items-center gap-2">
      <span className="relative flex h-2.5 w-2.5">
        <span
          className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${current.ping}`}
        />
        <span
          className={`relative inline-flex rounded-full h-2.5 w-2.5 ${current.color}`}
        />
      </span>
      {showLabel && (
        <span className={`text-xs font-semibold uppercase tracking-wider ${current.textColor}`}>
          {displayLabel}
        </span>
      )}
    </div>
  );
}
