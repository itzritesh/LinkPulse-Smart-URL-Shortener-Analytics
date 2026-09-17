import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Globe,
  ArrowUpRight,
  TrendingUp,
  MousePointer,
  Users,
  Percent,
  Timer,
  Share2,
  Lock,
  RotateCw,
  Sliders,
} from "lucide-react";
import Card from "@/components/common/Card";
import Badge from "@/components/common/Badge";

// Sample multi-period chart datasets
const DATASETS = {
  "24h": [
    { time: "00:00", clicks: 3200, unique: 2100 },
    { time: "03:00", clicks: 2100, unique: 1500 },
    { time: "06:00", clicks: 4500, unique: 3100 },
    { time: "09:00", clicks: 9800, unique: 6700 },
    { time: "12:00", clicks: 14200, unique: 9400 },
    { time: "15:00", clicks: 18900, unique: 12200 },
    { time: "18:00", clicks: 15400, unique: 10100 },
    { time: "21:00", clicks: 11200, unique: 7600 },
    { time: "23:59", clicks: 8600, unique: 5900 },
  ],
  "7d": [
    { time: "Mon", clicks: 18400, unique: 12100 },
    { time: "Tue", clicks: 24500, unique: 16800 },
    { time: "Wed", clicks: 31200, unique: 21400 },
    { time: "Thu", clicks: 28900, unique: 19800 },
    { time: "Fri", clicks: 34100, unique: 23600 },
    { time: "Sat", clicks: 19800, unique: 13900 },
    { time: "Sun", clicks: 22400, unique: 15200 },
  ],
  "30d": [
    { time: "Week 1", clicks: 92000, unique: 64000 },
    { time: "Week 2", clicks: 124000, unique: 87000 },
    { time: "Week 3", clicks: 148000, unique: 104000 },
    { time: "Week 4", clicks: 168000, unique: 119000 },
  ],
};

const REFERRERS = [
  { source: "Twitter / X", count: "58,420", share: 42, color: "bg-cyan-500" },
  { source: "LinkedIn", count: "34,210", share: 25, color: "bg-brand-500" },
  { source: "Direct / Email", count: "26,190", share: 19, color: "bg-emerald-500" },
  { source: "Reddit & HackerNews", count: "19,820", share: 14, color: "bg-amber-500" },
];

export default function BrowserMockupDashboard() {
  const [period, setPeriod] = useState("24h");
  const chartData = DATASETS[period];

  return (
    <section id="analytics-preview" className="py-16 md:py-24 bg-[#080b11] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
          <Badge variant="brand" className="mb-1">
            Real-Time Analytics Suite
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Deep click intelligence. Zero performance overhead.
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Inspect real-time visitor patterns, referrers, device telemetry, and geographical
            heatmaps from a consolidated, high-velocity dashboard.
          </p>
        </div>

        {/* Realistic Browser Frame Mockup */}
        <div className="relative max-w-5xl mx-auto rounded-3xl border border-slate-700/80 bg-[#0d121c] shadow-2xl overflow-hidden">
          {/* Top Browser Bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#0a0e17] border-b border-slate-800 text-xs">
            {/* Window Controls */}
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            </div>

            {/* URL Bar */}
            <div className="flex-1 max-w-md mx-4 flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[11px] truncate">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span className="truncate">https://app.linkpulse.io/analytics/pulse.to/launch-25</span>
            </div>

            {/* Browser Action Icon */}
            <div className="flex items-center gap-2 text-slate-500">
              <RotateCw className="w-3.5 h-3.5 hover:text-slate-300 cursor-pointer" />
            </div>
          </div>

          {/* Internal Dashboard View */}
          <div className="p-5 sm:p-8 space-y-6">
            {/* Dashboard Subheader & Range Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    Product Hunt Launch 2025
                  </h3>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Destination: <span className="text-slate-300">https://company.com/blog/spring-launch</span>
                </p>
              </div>

              {/* Time Range Switch */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                {["24h", "7d", "30d"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setPeriod(tab)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      period === tab
                        ? "bg-brand-500 text-white shadow-sm"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {tab.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Total Clicks</span>
                  <MousePointer className="w-4 h-4 text-cyanPulse-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-white">148,920</div>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +24.8% vs prior
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Unique Visitors</span>
                  <Users className="w-4 h-4 text-brand-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-white">94,210</div>
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3" /> +18.2% vs prior
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Click-Through Rate</span>
                  <Percent className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-white">4.82%</div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Top quartile in SaaS
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80">
                <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
                  <span>Edge Latency</span>
                  <Timer className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="text-2xl font-bold font-mono text-cyanPulse-300">18.4 ms</div>
                <span className="text-[11px] text-emerald-400 mt-1 block">
                  310+ Global PoPs
                </span>
              </div>
            </div>

            {/* Interactive Recharts Graph */}
            <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Click Velocity Over Time</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-400 font-mono">{period.toUpperCase()} Interval</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyanPulse-400 inline-block" />
                    Total Clicks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block" />
                    Unique
                  </span>
                </div>
              </div>

              <div className="h-64 sm:h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                    <XAxis
                      dataKey="time"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val)}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "12px",
                        color: "#f8fafc",
                        fontSize: "12px",
                      }}
                      itemStyle={{ color: "#f8fafc" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="#06b6d4"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorClicks)"
                    />
                    <Area
                      type="monotone"
                      dataKey="unique"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorUnique)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bottom Breakdown Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Top Referrers */}
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Top Referral Channels</span>
                  <span className="text-slate-500 font-normal">Traffic Share</span>
                </h4>
                <div className="space-y-3 pt-1">
                  {REFERRERS.map((ref) => (
                    <div key={ref.source} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-300 font-medium">{ref.source}</span>
                        <span className="text-slate-400 font-mono">
                          {ref.count} ({ref.share}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${ref.color} rounded-full`}
                          style={{ width: `${ref.share}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geographic Breakdown */}
              <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
                  <span>Audience by Country</span>
                  <span className="text-slate-500 font-normal">Regional Distribution</span>
                </h4>
                <div className="space-y-3 pt-1">
                  {[
                    { country: "United States", code: "US", share: 44, clicks: "65,520" },
                    { country: "United Kingdom", code: "GB", share: 18, clicks: "26,800" },
                    { country: "Germany", code: "DE", share: 14, clicks: "20,840" },
                    { country: "Japan & APAC", code: "JP", share: 12, clicks: "17,870" },
                  ].map((geo) => (
                    <div key={geo.country} className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-300 font-medium">{geo.country}</span>
                        <span className="text-slate-400 font-mono">
                          {geo.clicks} ({geo.share}%)
                        </span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-brand-500 to-cyanPulse-400 rounded-full"
                          style={{ width: `${geo.share}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
