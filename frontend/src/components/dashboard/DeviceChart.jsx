import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Laptop, Smartphone, Tablet, Globe2, Cpu, PieChart as PieIcon } from "lucide-react";

const PALETTE = [
  "#6366f1", // Brand Indigo
  "#06b6d4", // CyanPulse
  "#a855f7", // Purple
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#f43f5e", // Rose
  "#64748b", // Slate
];

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-surface-elevated/95 border border-surface-border rounded-xl px-3.5 py-2 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: payload[0].fill }}
          ></span>
          <span className="text-xs font-semibold text-white">{data.name}</span>
        </div>
        <div className="text-xs text-slate-300 mt-1 font-mono">
          {data.count.toLocaleString()} clicks ({data.percentage}%)
        </div>
      </div>
    );
  }
  return null;
}

export default function DeviceChart({
  devices = [],
  browsers = [],
  operatingSystems = [],
  isLoading = false,
  className = "",
}) {
  const [activeTab, setActiveTab] = useState("devices");

  const currentData =
    activeTab === "devices"
      ? devices
      : activeTab === "browsers"
      ? browsers
      : operatingSystems;

  const total = currentData.reduce((acc, curr) => acc + (curr.count || 0), 0);

  return (
    <div
      className={`saas-card p-6 border border-surface-border transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      {/* Header with Sub-tabs */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Device Distribution
            </h3>
          </div>
          {/* Sub-tab pills */}
          <div className="inline-flex p-1 rounded-xl bg-surface-canvas border border-surface-border text-xs">
            <button
              onClick={() => setActiveTab("devices")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTab === "devices"
                  ? "bg-brand-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Devices
            </button>
            <button
              onClick={() => setActiveTab("browsers")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTab === "browsers"
                  ? "bg-brand-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Browsers
            </button>
            <button
              onClick={() => setActiveTab("os")}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTab === "os"
                  ? "bg-brand-600 text-white shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              OS
            </button>
          </div>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Hardware and client environments accessing your shortened links.
        </p>
      </div>

      {isLoading ? (
        <div className="h-[220px] w-full flex items-center justify-center animate-pulse bg-slate-800/20 rounded-xl">
          <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        </div>
      ) : currentData.length === 0 || total === 0 ? (
        <div className="h-[220px] w-full flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
          <PieIcon className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-xs font-medium text-slate-400">No device telemetry yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
          {/* Donut Chart */}
          <div className="h-[190px] relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<CustomPieTooltip />} />
                <Pie
                  data={currentData}
                  dataKey="count"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={78}
                  paddingAngle={3}
                  stroke="#0f172a"
                  strokeWidth={2}
                >
                  {currentData.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={PALETTE[index % PALETTE.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold font-mono text-white">
                {total.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                Total
              </span>
            </div>
          </div>

          {/* Categorical Legend & Percentages */}
          <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1">
            {currentData.map((item, idx) => {
              const color = PALETTE[idx % PALETTE.length];
              return (
                <div
                  key={item.name}
                  className="flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    ></span>
                    <span className="text-slate-300 font-medium truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-slate-400">
                      {item.count.toLocaleString()}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700/50">
                      {item.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
