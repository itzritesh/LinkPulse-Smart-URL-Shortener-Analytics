import React, { useState, useEffect, useRef } from "react";
import {
  Filter,
  Calendar,
  Link2,
  Smartphone,
  Globe2,
  MapPin,
  Share2,
  RotateCcw,
  Check,
  X,
  Download,
  FileSpreadsheet,
  FileJson,
  ChevronDown,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import Button from "@/components/common/Button";

/**
 * Advanced Analytics Filter Bar supporting:
 * - Date Range (Today, 7D, 30D, 90D, Custom)
 * - URL selector
 * - Device selector
 * - Country selector
 * - Region selector
 * - Referral Source selector
 * - Comparison Toggle (Current vs Previous period)
 * - Apply Filters & Clear Filters
 * - Active Filter Badges with remove (✕)
 * - Export-ready dataset download (CSV & JSON)
 */
export default function AdvancedFilterBar({
  filters,
  onApplyFilters,
  onClearFilters,
  onRemoveFilter,
  filterOptions = {},
  onExport,
  isExporting = false,
  isLoading = false,
  className = "",
}) {
  // Local form state so users can select multiple filters before clicking "Apply Filters"
  const [draftFilters, setDraftFilters] = useState({
    period: filters.period || "30d",
    startDate: filters.startDate || "",
    endDate: filters.endDate || "",
    urlId: filters.urlId || "",
    device: filters.device || "",
    country: filters.country || "",
    region: filters.region || "",
    referrer: filters.referrer || "",
    compare: filters.compare !== undefined ? filters.compare : true,
  });

  // Sync draft with active filters when active filters change externally (e.g. badge removed)
  useEffect(() => {
    setDraftFilters({
      period: filters.period || "30d",
      startDate: filters.startDate || "",
      endDate: filters.endDate || "",
      urlId: filters.urlId || "",
      device: filters.device || "",
      country: filters.country || "",
      region: filters.region || "",
      referrer: filters.referrer || "",
      compare: filters.compare !== undefined ? filters.compare : true,
    });
  }, [filters]);

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportRef = useRef(null);

  // Close export dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (exportRef.current && !exportRef.current.contains(e.target)) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleDraftChange = (field, value) => {
    setDraftFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleApply = (e) => {
    e?.preventDefault?.();
    onApplyFilters(draftFilters);
  };

  const handleReset = () => {
    const defaultState = {
      period: "30d",
      startDate: "",
      endDate: "",
      urlId: "",
      device: "",
      country: "",
      region: "",
      referrer: "",
      compare: true,
    };
    setDraftFilters(defaultState);
    onClearFilters();
  };

  // Determine active filter badges
  const activeBadges = [];

  if (filters.period && filters.period !== "30d") {
    const periodLabels = {
      today: "Period: Today",
      "7d": "Period: Last 7 Days",
      "90d": "Period: Last 90 Days",
      custom: `Period: ${filters.startDate || "Start"} → ${filters.endDate || "End"}`,
    };
    activeBadges.push({
      key: "period",
      label: periodLabels[filters.period] || `Period: ${filters.period}`,
      onRemove: () => onRemoveFilter("period", "30d"),
    });
  }

  if (filters.urlId) {
    const matchedUrl = filterOptions.urls?.find(
      (u) => String(u.id) === String(filters.urlId)
    );
    activeBadges.push({
      key: "urlId",
      label: `URL: pulse.to/${matchedUrl ? matchedUrl.short_code : filters.urlId}`,
      onRemove: () => onRemoveFilter("urlId", ""),
    });
  }

  if (filters.device) {
    activeBadges.push({
      key: "device",
      label: `Device: ${filters.device}`,
      onRemove: () => onRemoveFilter("device", ""),
    });
  }

  if (filters.country) {
    activeBadges.push({
      key: "country",
      label: `Country: ${filters.country}`,
      onRemove: () => onRemoveFilter("country", ""),
    });
  }

  if (filters.region) {
    activeBadges.push({
      key: "region",
      label: `Region: ${filters.region}`,
      onRemove: () => onRemoveFilter("region", ""),
    });
  }

  if (filters.referrer) {
    activeBadges.push({
      key: "referrer",
      label: `Referral: ${filters.referrer}`,
      onRemove: () => onRemoveFilter("referrer", ""),
    });
  }

  if (filters.compare === false) {
    activeBadges.push({
      key: "compare",
      label: "Comparison: Disabled",
      onRemove: () => onRemoveFilter("compare", true),
    });
  }

  const hasNonDefaultFilters = activeBadges.length > 0;

  return (
    <div
      className={`p-5 rounded-2xl bg-[#0d121f] border border-slate-800 shadow-xl space-y-4 ${className}`}
    >
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
            <SlidersHorizontal className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Advanced Analytics Filter Engine
              {hasNonDefaultFilters && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  {activeBadges.length} active
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Database-level multi-dimensional telemetry filtering and period comparisons.
            </p>
          </div>
        </div>

        {/* Right Action: Export-Ready Dataset Dropdown */}
        <div className="relative self-start sm:self-auto" ref={exportRef}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            disabled={isExporting}
            className="text-xs bg-slate-900 border-slate-700 hover:border-slate-600 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-cyanPulse-400" />
            {isExporting ? "Exporting..." : "Export Dataset"}
            <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
          </Button>

          {exportMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-48 rounded-xl bg-slate-900/95 border border-slate-700 shadow-2xl py-1.5 z-40 backdrop-blur-md">
              <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                Filtered Telemetry Export
              </div>
              <button
                onClick={() => {
                  setExportMenuOpen(false);
                  onExport("csv");
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <span>Export as CSV (.csv)</span>
              </button>
              <button
                onClick={() => {
                  setExportMenuOpen(false);
                  onExport("json");
                }}
                className="w-full text-left px-3 py-2 text-xs text-slate-200 hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-colors"
              >
                <FileJson className="w-4 h-4 text-brand-400" />
                <span>Export as JSON (.json)</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Filter Controls Grid */}
      <form onSubmit={handleApply} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* 1. Date Range Preset */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>Date Range</span>
            </label>
            <select
              value={draftFilters.period}
              onChange={(e) => handleDraftChange("period", e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-brand-500 text-xs text-white rounded-xl px-2.5 py-2 outline-none transition-colors"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* 2. URL Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Link2 className="w-3 h-3 text-slate-400" />
              <span>Short Link</span>
            </label>
            <select
              value={draftFilters.urlId}
              onChange={(e) => handleDraftChange("urlId", e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-brand-500 text-xs text-white rounded-xl px-2.5 py-2 outline-none transition-colors"
            >
              <option value="">All Short Links</option>
              {filterOptions.urls?.map((u) => (
                <option key={u.id} value={u.id}>
                  pulse.to/{u.short_code} {u.title ? `(${u.title.slice(0, 16)})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Device Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-slate-400" />
              <span>Device</span>
            </label>
            <select
              value={draftFilters.device}
              onChange={(e) => handleDraftChange("device", e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-brand-500 text-xs text-white rounded-xl px-2.5 py-2 outline-none transition-colors"
            >
              <option value="">All Devices</option>
              <option value="Desktop">Desktop</option>
              <option value="Mobile">Mobile</option>
              <option value="Tablet">Tablet</option>
              {filterOptions.devices
                ?.filter((d) => !["Desktop", "Mobile", "Tablet"].includes(d))
                .map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
            </select>
          </div>

          {/* 4. Country Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Globe2 className="w-3 h-3 text-slate-400" />
              <span>Country</span>
            </label>
            <select
              value={draftFilters.country}
              onChange={(e) => handleDraftChange("country", e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-brand-500 text-xs text-white rounded-xl px-2.5 py-2 outline-none transition-colors"
            >
              <option value="">All Countries</option>
              {filterOptions.countries?.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* 5. Region Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" />
              <span>Region / State</span>
            </label>
            <select
              value={draftFilters.region}
              onChange={(e) => handleDraftChange("region", e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-brand-500 text-xs text-white rounded-xl px-2.5 py-2 outline-none transition-colors"
            >
              <option value="">All Regions</option>
              {filterOptions.regions?.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Referral Source Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
              <Share2 className="w-3 h-3 text-slate-400" />
              <span>Referral Source</span>
            </label>
            <select
              value={draftFilters.referrer}
              onChange={(e) => handleDraftChange("referrer", e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 hover:border-slate-700 focus:border-brand-500 text-xs text-white rounded-xl px-2.5 py-2 outline-none transition-colors"
            >
              <option value="">All Sources</option>
              <option value="Direct / Unknown">Direct / Unknown</option>
              {filterOptions.referrers
                ?.filter((ref) => ref !== "Direct / Unknown")
                .map((ref) => (
                  <option key={ref} value={ref}>
                    {ref}
                  </option>
                ))}
            </select>
          </div>
        </div>

        {/* Custom Date Pickers (Shown only if period === 'custom') */}
        {draftFilters.period === "custom" && (
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-wrap items-center gap-3 animate-in fade-in duration-200">
            <span className="text-xs font-semibold text-slate-300">Custom Boundaries:</span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">From:</span>
              <input
                type="date"
                value={draftFilters.startDate}
                onChange={(e) => handleDraftChange("startDate", e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">To:</span>
              <input
                type="date"
                value={draftFilters.endDate}
                onChange={(e) => handleDraftChange("endDate", e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-white rounded-lg px-2.5 py-1.5 outline-none focus:border-brand-500"
              />
            </div>
          </div>
        )}

        {/* Action Controls & Comparison Toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Comparison Toggle Switch */}
          <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={draftFilters.compare}
              onChange={(e) => handleDraftChange("compare", e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-500 relative"></div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-slate-200">
                Compare with previous period
              </span>
              <span className="text-[10px] text-slate-400">
                Calculates % change for Clicks, Visitors, Mobile & Referrals
              </span>
            </div>
          </label>

          {/* Apply & Clear Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isLoading}
              className="text-xs text-slate-400 hover:text-white"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Clear Filters
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={isLoading}
              className="text-xs shadow-md shadow-brand-500/20"
            >
              <Filter className="w-3.5 h-3.5 mr-1" />
              {isLoading ? "Applying..." : "Apply Filters"}
            </Button>
          </div>
        </div>
      </form>

      {/* Active Filter Badges */}
      {hasNonDefaultFilters && (
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Filters:
          </span>
          {activeBadges.map((b) => (
            <span
              key={b.key}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-500/15 text-brand-300 border border-brand-500/30 group transition-all"
            >
              <span>{b.label}</span>
              <button
                type="button"
                onClick={b.onRemove}
                className="w-3.5 h-3.5 rounded-full hover:bg-brand-500/30 flex items-center justify-center text-brand-300 hover:text-white transition-colors"
                title="Remove filter"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-rose-400 underline decoration-dotted transition-colors ml-1"
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
