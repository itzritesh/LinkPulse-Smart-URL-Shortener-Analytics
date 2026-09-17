import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Link2,
  MousePointerClick,
  Users,
  Zap,
  TrendingUp,
  Clock,
  ChevronLeft,
  ExternalLink,
  Calendar,
  Filter,
  Check,
  Power,
  RotateCw,
  SlidersHorizontal,
  ChevronDown,
  Laptop,
  Smartphone,
  Tablet,
  Globe2,
  Share2,
  Building2,
  MapPin,
  Flag,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  BarChart3,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { useToast } from "@/context/ToastContext";
import { urlService } from "@/services/urlService";
import { analyticsService } from "@/services/analyticsService";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import CopyButton from "@/components/urls/CopyButton";
import LinkStatusBadge from "@/components/urls/LinkStatusBadge";
import RecentClicksTable from "@/components/dashboard/RecentClicksTable";
import CreateLinkModal from "@/components/dashboard/CreateLinkModal";
import { formatDate, formatRelativeTime } from "@/utils/formatters";

// Distinct palette for devices and browsers
const PALETTE = ["#6366f1", "#06b6d4", "#a855f7", "#10b981", "#f59e0b", "#f43f5e", "#64748b"];

function CustomChartTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const val = payload[0].value;
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
          <Calendar className="w-3 h-3 text-slate-500" />
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-400"></span>
          <span className="text-sm font-bold text-white font-mono">
            {val.toLocaleString()} {val === 1 ? "click" : "clicks"}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-xl px-3.5 py-2 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: payload[0].fill }}></span>
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

export default function LinkAnalyticsPage() {
  const { urlId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const backendBaseUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  // Navigation states
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "traffic" | "devices" | "geography" | "referrals"
  const [geoSubTab, setGeoSubTab] = useState("countries"); // "countries" | "regions" | "cities"

  // Date Filtering states
  const [period, setPeriod] = useState("30d"); // "today" | "7d" | "30d" | "custom"
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [showCustomInputs, setShowCustomInputs] = useState(false);

  // Link switcher
  const [allUrls, setAllUrls] = useState([]);
  const [urlSwitcherOpen, setUrlSwitcherOpen] = useState(false);

  // Data states
  const [analytics, setAnalytics] = useState(null);
  const [recentClicks, setRecentClicks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all user links for the switcher
  useEffect(() => {
    urlService.getUrls().then((data) => setAllUrls(data || [])).catch(() => {});
  }, []);

  // Fetch link analytics & recent clicks
  const fetchLinkAnalytics = useCallback(async () => {
    if (!urlId) return;
    setIsLoading(true);
    try {
      const queryParams = { period };
      if (period === "custom" && customStart && customEnd) {
        queryParams.start_date = customStart;
        queryParams.end_date = customEnd;
      }

      const [summaryRes, clicksRes] = await Promise.all([
        analyticsService.getUrlAnalytics(urlId, queryParams),
        analyticsService.getUrlClicks(urlId, { ...queryParams, limit: 15 }),
      ]);

      setAnalytics(summaryRes);
      setRecentClicks(clicksRes.events || []);
    } catch (err) {
      toast.error(err.message || "Failed to load link analytics.");
    } finally {
      setIsLoading(false);
    }
  }, [urlId, period, customStart, customEnd, toast]);

  useEffect(() => {
    fetchLinkAnalytics();
  }, [fetchLinkAnalytics]);

  // Handle status toggle
  const handleToggleStatus = async () => {
    if (!analytics) return;
    try {
      const newStatus = !analytics.is_active;
      await urlService.updateUrlStatus(analytics.url_id, newStatus);
      setAnalytics((prev) => ({ ...prev, is_active: newStatus }));
      toast.success(newStatus ? "Short link activated!" : "Short link paused.");
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    }
  };

  const fullShortUrl = analytics ? `${backendBaseUrl}/${analytics.short_code}` : "";

  // Helper date labels
  const periodLabels = {
    today: "Today",
    "7d": "Last 7 Days",
    "30d": "Last 30 Days",
    custom: "Custom Range",
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex">
      {/* 1. Sidebar */}
      <DashboardSidebar
        activeTab="analytics"
        onTabChange={(tab) => {
          if (tab === "overview") navigate("/dashboard");
          else navigate(`/dashboard/${tab}`);
        }}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onOpenCreateModal={() => setCreateModalOpen(true)}
        totalLinksCount={allUrls.length}
      />

      {/* 2. Main Content Layout */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <DashboardHeader
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          period={period}
          onPeriodChange={(p) => setPeriod(p)}
          customStartDate={customStart}
          customEndDate={customEnd}
          onCustomDateChange={(s, e) => {
            setCustomStart(s);
            setCustomEnd(e);
            setPeriod("custom");
          }}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Breadcrumbs & Link Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Link to="/dashboard/links" className="hover:text-slate-200 flex items-center gap-1 transition-colors">
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>My Links</span>
              </Link>
              <span className="text-slate-600">/</span>
              <span className="text-brand-300 font-mono font-medium truncate max-w-[200px]">
                pulse.to/{analytics?.short_code || `link-${urlId}`}
              </span>
            </div>

            {/* Quick URL Switcher */}
            {allUrls.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setUrlSwitcherOpen(!urlSwitcherOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium transition-colors"
                >
                  <span className="text-slate-500">Switch URL:</span>
                  <span className="font-mono text-white font-semibold truncate max-w-[120px]">
                    /{analytics?.short_code}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                </button>

                {urlSwitcherOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-fade-in max-h-60 overflow-y-auto">
                    <div className="text-[10px] uppercase font-bold text-slate-500 px-2 py-1 tracking-wider">
                      Select Short Link
                    </div>
                    {allUrls.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setUrlSwitcherOpen(false);
                          navigate(`/dashboard/analytics/${u.id}`);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs transition-colors ${
                          String(u.id) === String(urlId)
                            ? "bg-brand-600/20 text-brand-300 font-semibold"
                            : "text-slate-300 hover:bg-slate-800/60"
                        }`}
                      >
                        <span className="font-mono truncate">pulse.to/{u.short_code}</span>
                        {String(u.id) === String(urlId) && <Check className="w-3.5 h-3.5 text-brand-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* DEDICATED TELEMETRY HERO HEADER BANNER */}
          {/* ========================================================================= */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#111827] to-[#0d121f] border border-slate-800/80 p-6 sm:p-7 shadow-xl">
            {/* Ambient Background Pulse */}
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Details */}
              <div className="space-y-3 max-w-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-2xl sm:text-3xl font-extrabold font-mono text-white tracking-tight">
                    pulse.to/{analytics?.short_code || "..."}
                  </span>
                  {analytics && (
                    <CopyButton textToCopy={fullShortUrl} size="md" />
                  )}
                  {analytics && (
                    <LinkStatusBadge isActive={analytics.is_active} />
                  )}
                </div>

                {analytics?.title && (
                  <h2 className="text-sm sm:text-base font-semibold text-slate-300">
                    {analytics.title}
                  </h2>
                )}

                {/* Original URL Pill */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <span className="text-slate-500 font-medium">Redirects to:</span>
                  <a
                    href={analytics?.original_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 hover:text-brand-300 font-mono truncate max-w-md transition-colors"
                  >
                    <span className="truncate">{analytics?.original_url || "..."}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-70" />
                  </a>
                </div>
              </div>

              {/* Right Controls: Status Toggle & Date Filter Strip */}
              <div className="flex flex-col sm:flex-row sm:items-center lg:flex-col lg:items-end gap-3 shrink-0">
                {/* Date Filter Pills */}
                <div className="inline-flex p-1 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs shadow-inner">
                  {[
                    { id: "today", label: "Today" },
                    { id: "7d", label: "7 Days" },
                    { id: "30d", label: "30 Days" },
                    { id: "custom", label: "Custom" },
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      onClick={() => {
                        if (btn.id === "custom") setShowCustomInputs(!showCustomInputs);
                        else {
                          setShowCustomInputs(false);
                          setPeriod(btn.id);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                        period === btn.id
                          ? "bg-brand-600 text-white font-semibold shadow-sm"
                          : "text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range Popover */}
                {showCustomInputs && (
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-wrap items-center gap-2 text-xs">
                    <input
                      type="date"
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                    <span className="text-slate-500">to</span>
                    <input
                      type="date"
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-white"
                    />
                    <button
                      onClick={() => {
                        setPeriod("custom");
                        setShowCustomInputs(false);
                      }}
                      disabled={!customStart || !customEnd}
                      className="px-3 py-1 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-medium disabled:opacity-50 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}

                {/* Actions: Toggle Active Status */}
                <button
                  onClick={handleToggleStatus}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                    analytics?.is_active
                      ? "bg-slate-800/80 hover:bg-amber-500/10 text-slate-300 hover:text-amber-400 border-slate-700 hover:border-amber-500/30"
                      : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-emerald-500/15 hover:text-emerald-400 hover:border-emerald-500/30"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{analytics?.is_active ? "Pause Link" : "Activate Link"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TOP 4 KEY PERFORMANCE INDICATORS (KPIS) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Clicks */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Total Redirect Clicks</span>
                <div className="w-8 h-8 rounded-lg bg-brand-500/15 border border-brand-500/30 flex items-center justify-center text-brand-400">
                  <MousePointerClick className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {(analytics?.total_clicks ?? 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-brand-400 mt-1 block">
                {analytics?.total_in_period?.toLocaleString() ?? 0} in selected {period}
              </span>
            </div>

            {/* 2. Unique Visitors */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Unique Visitors</span>
                <div className="w-8 h-8 rounded-lg bg-cyanPulse-500/15 border border-cyanPulse-500/30 flex items-center justify-center text-cyanPulse-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {(analytics?.unique_visitors ?? 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-cyanPulse-400 mt-1 block">
                Distinct IP sessions
              </span>
            </div>

            {/* 3. Clicks Today */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Clicks Today</span>
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold font-mono text-white">
                {(analytics?.kpis?.clicks_today ?? 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-amber-400 mt-1 block">
                Since 00:00 UTC
              </span>
            </div>

            {/* 4. Peak Traffic Period */}
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm hover:-translate-y-0.5 transition-all">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Peak Traffic Period</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-base font-bold font-mono text-emerald-400 truncate">
                {analytics?.peak_date || "N/A"}
              </div>
              <span className="text-[11px] text-slate-400 mt-1 block">
                {analytics?.peak_clicks ? `${analytics.peak_clicks} clicks peak volume` : "No peak velocity yet"}
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* SEGMENTED TAB NAVIGATION (5 FOCUSED VIEWS) */}
          {/* ========================================================================= */}
          <div className="border-b border-slate-800">
            <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar">
              {[
                { id: "overview", label: "Overview", icon: Layers },
                { id: "traffic", label: "Traffic", icon: TrendingUp },
                { id: "devices", label: "Devices", icon: Laptop },
                { id: "geography", label: "Geography", icon: Globe2 },
                { id: "referrals", label: "Referrals", icon: Share2 },
              ].map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                      isSelected
                        ? "border-brand-500 text-white bg-brand-500/10 rounded-t-xl"
                        : "border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-brand-400" : "text-slate-500"}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW TAB */}
          {/* ========================================================================= */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Clicks Timeline Preview Chart */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">
                      Click Velocity Trends
                    </h3>
                    <p className="text-xs text-slate-400">
                      Redirect events recorded across the selected {periodLabels[period] || period}.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab("traffic")}
                    className="text-xs text-brand-400 hover:text-brand-300 font-medium flex items-center gap-1"
                  >
                    <span>Inspect Traffic</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="h-[240px] w-full">
                  {analytics?.timeline?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.timeline}>
                        <defs>
                          <linearGradient id="linkClickGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => (val?.includes(" ") ? val.split(" ")[1] : val?.slice(5) || "")}
                        />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="clicks"
                          stroke="#6366f1"
                          strokeWidth={2.5}
                          fill="url(#linkClickGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500">
                      No click trends recorded in this period yet.
                    </div>
                  )}
                </div>
              </div>

              {/* 3 Quick Telemetry Glance Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Top Device */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Laptop className="w-3.5 h-3.5 text-brand-400" />
                    Top Device Type
                  </span>
                  <p className="text-base font-bold text-white font-mono">
                    {analytics?.devices?.[0]?.name || "N/A"}
                  </p>
                  <span className="text-slate-500 text-[11px]">
                    {analytics?.devices?.[0]?.percentage || 0}% of all visitors
                  </span>
                </div>

                {/* Top Location */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5 text-cyanPulse-400" />
                    Top Country
                  </span>
                  <p className="text-base font-bold text-white font-mono">
                    {analytics?.countries?.[0]?.name || "N/A"}
                  </p>
                  <span className="text-slate-500 text-[11px]">
                    {analytics?.countries?.[0]?.percentage || 0}% geographic share
                  </span>
                </div>

                {/* Top Referral */}
                <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
                  <span className="text-slate-400 font-medium flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-purple-400" />
                    Top Referral Source
                  </span>
                  <p className="text-base font-bold text-white font-mono truncate">
                    {analytics?.referrals?.[0]?.name || "Direct"}
                  </p>
                  <span className="text-slate-500 text-[11px]">
                    {analytics?.referrals?.[0]?.percentage || 0}% conversion share
                  </span>
                </div>
              </div>

              {/* Recent Clicks Log */}
              <RecentClicksTable clicks={recentClicks} isLoading={isLoading} />
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TRAFFIC TAB */}
          {/* ========================================================================= */}
          {activeTab === "traffic" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">
                      Detailed Traffic Velocity
                    </h3>
                    <p className="text-xs text-slate-400">
                      Redirect traffic timeline with peak timestamps and daily conversion rate.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <div className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60">
                      <span className="text-slate-500 text-[10px] block">Average Velocity</span>
                      <span className="font-mono font-bold text-white">
                        {analytics?.average_clicks_per_day || 0} clicks/day
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-[320px] w-full">
                  {analytics?.timeline?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.timeline}>
                        <defs>
                          <linearGradient id="trafficGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis
                          dataKey="date"
                          stroke="#64748b"
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(val) => (val?.includes(" ") ? val.split(" ")[1] : val?.slice(5) || "")}
                        />
                        <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="clicks"
                          stroke="#6366f1"
                          strokeWidth={3}
                          fill="url(#trafficGradient)"
                          activeDot={{ r: 6, fill: "#818cf8" }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500">
                      No traffic data in this interval.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: DEVICES TAB (3 CHARTS: DEVICE, BROWSER, OS) */}
          {/* ========================================================================= */}
          {activeTab === "devices" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 1. Device Type Breakdown */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                      <Laptop className="w-4 h-4 text-brand-400" />
                      Device Breakdown
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-3">Hardware category split</p>
                  </div>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Pie data={analytics?.devices || []} dataKey="count" nameKey="name" innerRadius={45} outerRadius={68} paddingAngle={3}>
                          {(analytics?.devices || []).map((_, i) => (
                            <Cell key={`dev-${i}`} fill={PALETTE[i % PALETTE.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60 max-h-36 overflow-y-auto">
                    {(analytics?.devices || []).map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE[i % PALETTE.length] }} />
                          {d.name}
                        </span>
                        <span className="font-mono text-slate-400">{d.count} ({d.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Browser Breakdown */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-cyanPulse-400" />
                      Browser Breakdown
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-3">Web rendering clients</p>
                  </div>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Pie data={analytics?.browsers || []} dataKey="count" nameKey="name" innerRadius={45} outerRadius={68} paddingAngle={3}>
                          {(analytics?.browsers || []).map((_, i) => (
                            <Cell key={`brw-${i}`} fill={PALETTE[(i + 2) % PALETTE.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60 max-h-36 overflow-y-auto">
                    {(analytics?.browsers || []).map((b, i) => (
                      <div key={b.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE[(i + 2) % PALETTE.length] }} />
                          {b.name}
                        </span>
                        <span className="font-mono text-slate-400">{b.count} ({b.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Operating System Breakdown */}
                <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      Operating System Breakdown
                    </h4>
                    <p className="text-[11px] text-slate-400 mb-3">Visitor host platforms</p>
                  </div>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip content={<CustomPieTooltip />} />
                        <Pie data={analytics?.operating_systems || []} dataKey="count" nameKey="name" innerRadius={45} outerRadius={68} paddingAngle={3}>
                          {(analytics?.operating_systems || []).map((_, i) => (
                            <Cell key={`os-${i}`} fill={PALETTE[(i + 4) % PALETTE.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800/60 max-h-36 overflow-y-auto">
                    {(analytics?.operating_systems || []).map((o, i) => (
                      <div key={o.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-slate-300">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PALETTE[(i + 4) % PALETTE.length] }} />
                          {o.name}
                        </span>
                        <span className="font-mono text-slate-400">{o.count} ({o.percentage}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: GEOGRAPHY TAB (STRICTLY NON-MAP RANKINGS) */}
          {/* ========================================================================= */}
          {activeTab === "geography" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white tracking-tight">
                      Geographic Distribution
                    </h3>
                    <p className="text-xs text-slate-400">
                      Coarse approximate location breakdown (strictly non-map ranked views).
                    </p>
                  </div>

                  {/* Subtabs for Countries, Regions, Cities */}
                  <div className="inline-flex p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
                    {[
                      { id: "countries", label: "Countries" },
                      { id: "regions", label: "Regions / States" },
                      { id: "cities", label: "Top Cities" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        onClick={() => setGeoSubTab(st.id)}
                        className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                          geoSubTab === st.id
                            ? "bg-brand-600 text-white font-semibold shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ranked List with Horizontal Progress Bar */}
                <div className="space-y-3 pt-2">
                  {(() => {
                    const list =
                      geoSubTab === "countries"
                        ? analytics?.countries || []
                        : geoSubTab === "regions"
                        ? analytics?.regions || []
                        : analytics?.cities || [];

                    if (!list.length) {
                      return (
                        <div className="py-12 text-center text-xs text-slate-500">
                          No geographic telemetry recorded for this link yet.
                        </div>
                      );
                    }

                    return list.map((item, idx) => {
                      const rank = idx + 1;
                      return (
                        <div key={item.name + idx} className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-mono font-bold ${
                                  rank === 1
                                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    : rank === 2
                                    ? "bg-slate-400/20 text-slate-200 border border-slate-400/30"
                                    : rank === 3
                                    ? "bg-amber-700/20 text-amber-400 border border-amber-700/30"
                                    : "bg-slate-800 text-slate-400 border border-slate-700"
                                }`}
                              >
                                {rank}
                              </span>
                              {geoSubTab === "countries" && <Flag className="w-3.5 h-3.5 text-slate-400" />}
                              {geoSubTab === "regions" && <MapPin className="w-3.5 h-3.5 text-slate-400" />}
                              {geoSubTab === "cities" && <Building2 className="w-3.5 h-3.5 text-slate-400" />}
                              <span className="text-white font-medium">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-white font-bold">{item.count.toLocaleString()} clicks</span>
                              <span className="text-[11px] font-mono text-slate-400 w-12 text-right">{item.percentage}%</span>
                            </div>
                          </div>
                          <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-brand-500 to-cyanPulse-400 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(3, item.percentage))}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: REFERRALS TAB */}
          {/* ========================================================================= */}
          {activeTab === "referrals" && (
            <div className="space-y-6">
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm space-y-4">
                <div>
                  <h3 className="text-base font-semibold text-white tracking-tight">
                    Referral Traffic Sources
                  </h3>
                  <p className="text-xs text-slate-400">
                    Hostnames and external platforms directing users to this shortened URL.
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {analytics?.referrals?.length ? (
                    analytics.referrals.map((ref, idx) => (
                      <div key={ref.name + idx} className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/60 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-300 font-mono text-[11px] border border-brand-500/20">
                              #{idx + 1}
                            </span>
                            <span className="text-white font-medium">{ref.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-white font-bold">{ref.count.toLocaleString()} clicks</span>
                            <span className="text-[11px] font-mono text-slate-400 w-12 text-right">{ref.percentage}%</span>
                          </div>
                        </div>
                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-brand-500 to-cyanPulse-400 rounded-full"
                            style={{ width: `${Math.min(100, Math.max(3, ref.percentage))}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-xs text-slate-500">
                      No external referral sources detected yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Global Quick Create Link Modal */}
      <CreateLinkModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onLinkCreated={() => {
          toast.success("Short link created!");
          fetchLinkAnalytics();
        }}
      />
    </div>
  );
}
