import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, MousePointerClick, Calendar } from "lucide-react";

/**
 * Custom Tooltip for ClicksChart with dark surface styling
 */
function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const clicks = payload[0].value;
    return (
      <div className="bg-surface-elevated/95 border border-surface-border rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-brand-400 shadow-sm shadow-brand-500/50"></span>
          <span className="text-sm font-semibold text-white font-mono">
            {clicks.toLocaleString()} {clicks === 1 ? "click" : "clicks"}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Premium Recharts Clicks Over Time Area Chart
 */
export default function ClicksChart({
  data = [],
  period = "30d",
  peakDate,
  peakClicks = 0,
  averageClicks = 0,
  isLoading = false,
  className = "",
}) {
  const totalClicks = data.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

  return (
    <div
      className={`saas-card p-6 border border-surface-border transition-all duration-200 ${className}`}
    >
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Clicks Over Time
            </h3>
            <span className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-brand-500/10 text-brand-300 border border-brand-500/20">
              {period === "today" ? "Hourly Trends" : "Daily Activity"}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time redirect engagement across the selected date window.
          </p>
        </div>

        {/* Quick Highlights Pill */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-surface-canvas border border-surface-border">
            <span className="text-slate-400 text-[11px] block">Period Total</span>
            <span className="font-mono font-bold text-white text-sm">
              {totalClicks.toLocaleString()}
            </span>
          </div>
          {peakClicks > 0 && (
            <div className="px-3 py-1.5 rounded-xl bg-surface-canvas border border-surface-border">
              <span className="text-slate-400 text-[11px] block">Peak Velocity</span>
              <span className="font-mono font-bold text-brand-400 text-sm">
                {peakClicks.toLocaleString()}/day
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Chart Area */}
      {isLoading ? (
        <div className="h-[280px] w-full flex items-center justify-center animate-pulse bg-surface-canvas/50 rounded-xl">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
            Loading timeline data...
          </div>
        </div>
      ) : data.length === 0 || totalClicks === 0 ? (
        <div className="h-[280px] w-full flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-surface-border bg-surface-canvas/30">
          <div className="w-12 h-12 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-center text-slate-500 mb-3">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <p className="text-sm font-medium text-slate-300">No clicks recorded in this period</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Share your shortened links on social media or in campaigns to start visualizing traffic flow.
          </p>
        </div>
      ) : (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="clickGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c253b" vertical={false} opacity={0.8} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => {
                  if (!val) return "";
                  if (val.includes(" ")) return val.split(" ")[1]; // Hour if today
                  return val.slice(5); // MM-DD
                }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<CustomChartTooltip />} />
              <Area
                type="monotone"
                dataKey="clicks"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#clickGradient)"
                activeDot={{
                  r: 5,
                  fill: "#818cf8",
                  stroke: "#090d16",
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
