import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  BarChart2,
  TrendingUp,
  Cpu,
  Shield,
  Smartphone,
  Laptop,
  CheckCircle,
  Clock,
} from "lucide-react";
import Card from "@/components/common/Card";
import Badge from "@/components/common/Badge";

const DEVICE_DATA = [
  { name: "iOS (iPhone)", share: 46, color: "#06b6d4" },
  { name: "Android", share: 22, color: "#6366f1" },
  { name: "macOS", share: 18, color: "#818cf8" },
  { name: "Windows", share: 11, color: "#a5b4fc" },
  { name: "Linux / Other", share: 3, color: "#64748b" },
];

const HOURLY_DATA = [
  { hour: "6 AM", clicks: 1200 },
  { hour: "9 AM", clicks: 4300 },
  { hour: "12 PM", clicks: 8900 },
  { hour: "3 PM", clicks: 12400 },
  { hour: "6 PM", clicks: 9600 },
  { hour: "9 PM", clicks: 6800 },
  { hour: "12 AM", clicks: 3100 },
];

export default function AnalyticsShowcase() {
  const [activeTab, setActiveTab] = useState("devices");

  return (
    <section id="analytics" className="py-20 md:py-28 bg-[#080b11] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="info">Granular Telemetry</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Designed for data-driven growth teams
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Gain deep behavioral clarity without setting up heavy analytics scripts or
            compromising visitor privacy.
          </p>
        </div>

        {/* Analytics Showcase Container */}
        <div className="max-w-5xl mx-auto saas-card p-6 sm:p-10 border border-slate-700/80 shadow-2xl space-y-8">
          {/* Controls & Tab selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-cyanPulse-400" />
                <span>Audience Segmentation Breakdown</span>
              </h3>
              <p className="text-xs text-slate-400">
                Aggregated cross-platform analytics across all active short links
              </p>
            </div>

            <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab("devices")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === "devices"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                OS & Devices
              </button>
              <button
                onClick={() => setActiveTab("hourly")}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  activeTab === "hourly"
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Peak Velocity
              </button>
            </div>
          </div>

          {/* Interactive Chart Canvas */}
          <div className="h-72 sm:h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === "devices" ? (
                <BarChart
                  data={DEVICE_DATA}
                  margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="name"
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
                    tickFormatter={(val) => `${val}%`}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                    formatter={(val) => [`${val}% of total audience`, "Traffic Share"]}
                  />
                  <Bar dataKey="share" radius={[8, 8, 0, 0]}>
                    {DEVICE_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <BarChart
                  data={HOURLY_DATA}
                  margin={{ top: 10, right: 10, left: -10, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis
                    dataKey="hour"
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
                    cursor={{ fill: "rgba(6, 182, 212, 0.08)" }}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      borderColor: "#334155",
                      borderRadius: "12px",
                      color: "#f8fafc",
                      fontSize: "12px",
                    }}
                    formatter={(val) => [`${val} clicks/hr`, "Click Velocity"]}
                  />
                  <Bar dataKey="clicks" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-800">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400">Mobile Dominance</span>
              <div className="text-xl font-bold text-cyanPulse-300 font-mono mt-0.5">68%</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Optimized for instant mobile in-app webviews
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400">Peak Hour Spike</span>
              <div className="text-xl font-bold text-brand-300 font-mono mt-0.5">3:00 PM EST</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Highest global conversion probability window
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <span className="text-xs text-slate-400">Bot Traffic Filtered</span>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">14.2%</div>
              <p className="text-[11px] text-slate-500 mt-1">
                Automated crawlers excluded from metrics
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
