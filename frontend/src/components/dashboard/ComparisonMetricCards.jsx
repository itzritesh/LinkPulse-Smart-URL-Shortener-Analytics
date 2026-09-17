import React from "react";
import {
  MousePointerClick,
  Users,
  Smartphone,
  Share2,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import AnimatedCounter from "@/components/common/AnimatedCounter";

/**
 * Visual badge indicating percentage increase, decrease, or neutral baseline.
 */
function TrendBadge({ changePct, trend }) {
  const isUp = trend === "up";
  const isDown = trend === "down";

  const colorClasses = isUp
    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
    : isDown
    ? "bg-rose-500/15 text-rose-400 border-rose-500/30"
    : "bg-slate-800/80 text-slate-400 border-slate-700/50";

  const Icon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;

  const formattedPct = changePct !== undefined && changePct !== null
    ? (changePct > 0 ? `+${changePct}%` : `${changePct}%`)
    : "0%";

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border shadow-sm transition-all ${colorClasses}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{formattedPct}</span>
    </span>
  );
}

/**
 * 4 Executive Comparison Metric Cards comparing current period vs previous period
 * with visual indicators for percentage changes.
 */
export default function ComparisonMetricCards({
  comparison,
  isLoading = false,
  className = "",
}) {
  if (!comparison) return null;

  const {
    current_period = "Current period",
    previous_period = "Previous period",
    clicks,
    visitors,
    mobile_traffic,
    referral_traffic,
  } = comparison;

  const metrics = [
    {
      id: "clicks",
      title: "Total Clicks",
      icon: MousePointerClick,
      iconColor: "text-brand-400",
      accentBg: "from-brand-500/10 to-transparent",
      data: clicks,
    },
    {
      id: "visitors",
      title: "Unique Visitors",
      icon: Users,
      iconColor: "text-cyanPulse-400",
      accentBg: "from-cyan-500/10 to-transparent",
      data: visitors,
    },
    {
      id: "mobile",
      title: "Mobile Traffic",
      icon: Smartphone,
      iconColor: "text-amber-400",
      accentBg: "from-amber-500/10 to-transparent",
      data: mobile_traffic,
    },
    {
      id: "referral",
      title: "Referral Traffic",
      icon: Share2,
      iconColor: "text-emerald-400",
      accentBg: "from-emerald-500/10 to-transparent",
      data: referral_traffic,
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between text-xs text-slate-400 px-0.5">
        <span className="font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse"></span>
          Period Comparison Analysis
        </span>
        <span className="font-mono text-slate-400 text-[11px]">
          {current_period} vs {previous_period}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          const currentVal = m.data?.current ?? 0;
          const prevVal = m.data?.previous ?? 0;
          const changePct = m.data?.change_pct ?? 0;
          const trend = m.data?.trend ?? "neutral";

          return (
            <div
              key={m.id}
              className="group relative p-5 rounded-2xl bg-[#0f1422] border border-[#1c253b] hover:border-[#2a3754] shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 overflow-hidden"
              style={{
                boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 6px 16px -2px rgba(0, 0, 0, 0.5)",
              }}
            >
              {/* Subtle top gradient glow */}
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${m.accentBg}`}
              />

              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
                  {m.title}
                </span>
                <div className="w-8 h-8 rounded-xl bg-[#141b2d] border border-[#1c253b] flex items-center justify-center shrink-0">
                  <Icon className={`w-4 h-4 ${m.iconColor}`} />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="text-2xl font-bold font-mono tracking-tight text-white">
                  {isLoading ? (
                    "..."
                  ) : (
                    <AnimatedCounter value={currentVal} />
                  )}
                </span>
                <TrendBadge changePct={changePct} trend={trend} />
              </div>

              <div className="flex items-center justify-between text-xs border-t border-[#1c253b]/80 pt-2.5 text-slate-400">
                <span>Previous:</span>
                <span className="font-mono font-medium text-slate-300">
                  {isLoading ? "..." : prevVal.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
