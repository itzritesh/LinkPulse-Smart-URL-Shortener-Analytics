import React, { useState } from "react";
import { Globe2, MapPin, Building2, Flag } from "lucide-react";

export default function LocationTable({
  countries = [],
  regions = [],
  cities = [],
  isLoading = false,
  className = "",
}) {
  const [activeTab, setActiveTab] = useState("countries");

  const currentList =
    activeTab === "countries"
      ? countries
      : activeTab === "regions"
      ? regions
      : cities;

  const total = currentList.reduce((acc, curr) => acc + (curr.count || 0), 0);

  return (
    <div
      className={`p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      {/* Header with Geographic Tabs */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-white tracking-tight">
                Geographic Analytics
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Privacy-preserving approximate location breakdown across regions.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="inline-flex p-0.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs self-start sm:self-auto">
            <button
              onClick={() => setActiveTab("countries")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === "countries"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Countries
            </button>
            <button
              onClick={() => setActiveTab("regions")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === "regions"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Regions / States
            </button>
            <button
              onClick={() => setActiveTab("cities")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                activeTab === "cities"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Top Cities
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="h-[240px] w-full flex items-center justify-center animate-pulse bg-slate-800/20 rounded-xl mt-4">
          <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        </div>
      ) : currentList.length === 0 || total === 0 ? (
        <div className="h-[240px] w-full flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/30 mt-4">
          <Globe2 className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-xs font-medium text-slate-400">
            No geographic data in this period
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Locations will be inferred automatically from incoming visitor traffic.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-3 max-h-[260px] overflow-y-auto pr-1">
          {currentList.slice(0, 8).map((item, index) => {
            const rank = index + 1;
            const percentage =
              item.percentage ??
              (total > 0 ? ((item.count / total) * 100).toFixed(1) : 0);

            return (
              <div
                key={item.name + index}
                className="group p-2 rounded-xl hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2.5 truncate pr-2">
                    {/* Rank Badge */}
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                        rank === 1
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : rank === 2
                          ? "bg-slate-400/20 text-slate-200 border border-slate-400/30"
                          : rank === 3
                          ? "bg-amber-700/20 text-amber-400 border border-amber-700/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700/50"
                      }`}
                    >
                      {rank}
                    </span>

                    {/* Icon */}
                    {activeTab === "countries" ? (
                      <Flag className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : activeTab === "regions" ? (
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    ) : (
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}

                    <span className="text-slate-200 font-medium truncate group-hover:text-white transition-colors">
                      {item.name || "Unknown"}
                    </span>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-white font-semibold text-xs">
                      {item.count.toLocaleString()}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700/50 w-12 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Horizontal Bar Chart */}
                <div className="h-1.5 w-full bg-slate-800/80 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-cyanPulse-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(3, percentage))}%`,
                    }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
