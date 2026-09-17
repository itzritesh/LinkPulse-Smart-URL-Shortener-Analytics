import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import AnimatedCounter from "@/components/common/AnimatedCounter";

/**
 * Premium SaaS StatCard Component with subtle iconography,
 * animated number counter, hover elevation, and skeleton state.
 */
export default function StatCard({
  title,
  value,
  change,
  trend = "neutral",
  icon: Icon,
  iconColor = "text-brand-400",
  subtitle,
  isLoading = false,
  className = "",
}) {
  if (isLoading) {
    return (
      <div className={`p-5 rounded-2xl bg-[#0f1422] border border-[#1c253b] shadow-card animate-pulse ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="h-3.5 w-24 bg-slate-800/80 rounded"></div>
          <div className="w-8 h-8 rounded-xl bg-slate-800/80"></div>
        </div>
        <div className="h-7 w-20 bg-slate-800/80 rounded mb-2"></div>
        <div className="h-3 w-32 bg-slate-800/80 rounded"></div>
      </div>
    );
  }

  const isNumeric = typeof value === "number" || (!isNaN(value) && value !== "");

  return (
    <div
      className={`group relative p-5 rounded-2xl bg-[#0f1422] border border-[#1c253b] hover:border-[#2a3754] shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 ${className}`}
      style={{
        boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 6px 16px -2px rgba(0, 0, 0, 0.5)",
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-400 group-hover:text-slate-300 transition-colors">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-[#141b2d] border border-[#1c253b] flex items-center justify-center shrink-0 group-hover:border-slate-600 transition-colors shadow-sm">
            <Icon className={`w-4 h-4 ${iconColor}`} />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-1.5">
        <span className="text-2xl font-bold font-mono tracking-tight text-white">
          {isNumeric ? (
            <AnimatedCounter value={Number(value)} />
          ) : (
            value ?? "0"
          )}
        </span>
      </div>

      <div className="flex items-center justify-between text-xs">
        {change && (
          <span
            className={`inline-flex items-center gap-1 font-medium ${
              trend === "up"
                ? "text-emerald-400"
                : trend === "down"
                ? "text-rose-400"
                : "text-slate-400"
            }`}
          >
            {trend === "up" && <TrendingUp className="w-3 h-3" />}
            {trend === "down" && <TrendingDown className="w-3 h-3" />}
            {trend === "neutral" && <Minus className="w-3 h-3" />}
            {change}
          </span>
        )}
        {subtitle && (
          <span className="text-slate-500 text-[11px] truncate ml-auto">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

