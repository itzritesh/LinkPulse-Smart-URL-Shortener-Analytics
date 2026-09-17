import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Link2,
  MousePointerClick,
  Zap,
  CheckCircle2,
  ShieldCheck,
  Globe2,
  Plus,
  RotateCw,
  SlidersHorizontal,
  ExternalLink,
  Filter,
  Smartphone,
  Layers,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

// Services
import { urlService } from "@/services/urlService";
import { analyticsService } from "@/services/analyticsService";

// Layout & Reusable Dashboard Components
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DashboardSkeleton from "@/components/dashboard/DashboardSkeleton";
import StatCard from "@/components/dashboard/StatCard";
import ClicksChart from "@/components/dashboard/ClicksChart";
import DeviceChart from "@/components/dashboard/DeviceChart";
import ReferralChart from "@/components/dashboard/ReferralChart";
import LocationTable from "@/components/dashboard/LocationTable";
import RecentClicksTable from "@/components/dashboard/RecentClicksTable";
import TopLinksTable from "@/components/dashboard/TopLinksTable";
import CreateLinkModal from "@/components/dashboard/CreateLinkModal";
import MyLinksView from "@/components/dashboard/MyLinksView";
import AdvancedFilterBar from "@/components/dashboard/AdvancedFilterBar";
import ComparisonMetricCards from "@/components/dashboard/ComparisonMetricCards";

// Existing URL Management
import Button from "@/components/common/Button";
import Card from "@/components/common/Card";
import Badge from "@/components/common/Badge";

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  // Navigation & Layout States
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const location = useLocation();

  // Synchronize activeTab with URL route
  useEffect(() => {
    if (location.pathname === "/dashboard/links") {
      setActiveTab("links");
    } else if (location.pathname === "/dashboard/analytics") {
      setActiveTab("analytics");
    } else if (location.pathname === "/dashboard/settings") {
      setActiveTab("settings");
    } else {
      setActiveTab("overview");
    }
  }, [location.pathname]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "overview") {
      setSelectedUrlId(null);
      navigate("/dashboard");
    } else {
      navigate(`/dashboard/${tab}`);
    }
  };

  const handleOpenAnalytics = (link) => {
    setSelectedUrlId(link.id);
    navigate(`/dashboard/analytics/${link.id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.info(`Inspecting analytics for pulse.to/${link.short_code}`);
  };

  // Filters
  const [period, setPeriod] = useState("30d");
  const [searchQuery, setSearchQuery] = useState("");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedUrlId, setSelectedUrlId] = useState(null); // null = all links overview

  // Data States
  const [isLoading, setIsLoading] = useState(true);
  const [urls, setUrls] = useState([]);
  const [topLinks, setTopLinks] = useState([]);
  const [recentClicks, setRecentClicks] = useState([]);
  const [overviewData, setOverviewData] = useState(null);
  const [specificUrlData, setSpecificUrlData] = useState(null);

  // Fetch all dashboard data
  const loadDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch user's links
      const fetchedUrls = await urlService.getUrls();
      setUrls(fetchedUrls || []);

      // 2. Determine period days for overview
      const days = period === "today" ? 1 : period === "7d" ? 7 : 30;

      // 3. If a specific URL is selected for in-depth inspection
      if (selectedUrlId) {
        const queryParams = { period };
        if (period === "custom" && customStartDate && customEndDate) {
          queryParams.start_date = customStartDate;
          queryParams.end_date = customEndDate;
        }

        const [urlSummary, urlClicksData] = await Promise.all([
          analyticsService.getUrlAnalytics(selectedUrlId, queryParams),
          analyticsService.getUrlClicks(selectedUrlId, { ...queryParams, limit: 10 }),
        ]);

        setSpecificUrlData(urlSummary);
        setRecentClicks(urlClicksData.events || []);
      } else {
        // 4. Account-wide aggregate overview
        const [overviewRes, clicksRes, topLinksRes] = await Promise.all([
          analyticsService.getOverviewAnalytics({ days }),
          analyticsService.getRecentClicks({ limit: 10 }),
          analyticsService.getTopLinks({ limit: 6 }),
        ]);

        setOverviewData(overviewRes);
        setRecentClicks(clicksRes || []);
        setTopLinks(topLinksRes || []);
        setSpecificUrlData(null);
      }
    } catch (err) {
      toast.error(err.message || "Failed to refresh dashboard data.");
    } finally {
      setIsLoading(false);
    }
  }, [period, customStartDate, customEndDate, selectedUrlId, toast]);

  // Advanced Filter state for Analytics studio
  const [advancedFilters, setAdvancedFilters] = useState({
    period: "30d",
    startDate: "",
    endDate: "",
    urlId: "",
    device: "",
    country: "",
    region: "",
    referrer: "",
    compare: true,
  });
  const [filterOptions, setFilterOptions] = useState({
    devices: [],
    countries: [],
    regions: [],
    referrers: [],
    urls: [],
  });
  const [filteredAnalytics, setFilteredAnalytics] = useState(null);
  const [isLoadingFiltered, setIsLoadingFiltered] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Fetch filtered analytics from backend
  const loadFilteredAnalytics = useCallback(async (customParams = null) => {
    setIsLoadingFiltered(true);
    const active = customParams || advancedFilters;
    try {
      const query = {
        period: active.period || "30d",
        compare: active.compare !== undefined ? active.compare : true,
      };
      if (active.period === "custom" && active.startDate && active.endDate) {
        query.start_date = active.startDate;
        query.end_date = active.endDate;
      }
      if (active.urlId) query.url_id = active.urlId;
      if (active.device) query.device = active.device;
      if (active.country) query.country = active.country;
      if (active.region) query.region = active.region;
      if (active.referrer) query.referrer = active.referrer;

      const [res, optionsRes] = await Promise.all([
        analyticsService.getFilteredAnalytics(query),
        analyticsService.getFilterOptions(),
      ]);
      setFilteredAnalytics(res);
      if (optionsRes) setFilterOptions(optionsRes);
    } catch (err) {
      toast.error(err.message || "Failed to load filtered analytics.");
    } finally {
      setIsLoadingFiltered(false);
    }
  }, [advancedFilters, toast]);

  useEffect(() => {
    if (activeTab === "analytics") {
      loadFilteredAnalytics();
    }
  }, [activeTab, loadFilteredAnalytics]);

  const handleApplyAdvancedFilters = (newDraftFilters) => {
    setAdvancedFilters(newDraftFilters);
    loadFilteredAnalytics(newDraftFilters);
    toast.success("Applied database filters.");
  };

  const handleClearAdvancedFilters = () => {
    const cleared = {
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
    setAdvancedFilters(cleared);
    loadFilteredAnalytics(cleared);
    toast.info("Reset filters to default (30 Days, All Links).");
  };

  const handleRemoveFilter = (field, fallbackVal) => {
    const updated = { ...advancedFilters, [field]: fallbackVal };
    setAdvancedFilters(updated);
    loadFilteredAnalytics(updated);
    toast.info(`Removed filter: ${field}`);
  };

  const handleExportDataset = async (format = "csv") => {
    setIsExporting(true);
    try {
      const query = {
        period: advancedFilters.period || "30d",
      };
      if (advancedFilters.period === "custom" && advancedFilters.startDate && advancedFilters.endDate) {
        query.start_date = advancedFilters.startDate;
        query.end_date = advancedFilters.endDate;
      }
      if (advancedFilters.urlId) query.url_id = advancedFilters.urlId;
      if (advancedFilters.device) query.device = advancedFilters.device;
      if (advancedFilters.country) query.country = advancedFilters.country;
      if (advancedFilters.region) query.region = advancedFilters.region;
      if (advancedFilters.referrer) query.referrer = advancedFilters.referrer;

      await analyticsService.exportFilteredAnalytics(query, format);
      toast.success(`Exported filtered dataset as ${format.toUpperCase()}!`);
    } catch (err) {
      toast.error(err.message || "Failed to export dataset.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Handle URL creation from modal
  const handleLinkCreated = (newLink) => {
    setUrls((prev) => [newLink, ...prev]);
    toast.success("Short link created successfully!");
    loadDashboardData();
  };

  // Handle link status toggle
  const handleToggleStatus = async (urlId, newStatus) => {
    try {
      const updated = await urlService.updateUrlStatus(urlId, newStatus);
      setUrls((prev) => prev.map((u) => (u.id === urlId ? updated : u)));
      toast.success(newStatus ? "Short link activated!" : "Short link paused.");
    } catch (err) {
      toast.error(err.message || "Failed to update status.");
    }
  };

  // Handle link deletion
  const handleDeleteUrl = async (urlId) => {
    try {
      await urlService.deleteUrl(urlId);
      setUrls((prev) => prev.filter((u) => u.id !== urlId));
      if (selectedUrlId === urlId) setSelectedUrlId(null);
      toast.success("Short link deleted successfully.");
      loadDashboardData();
    } catch (err) {
      toast.error(err.message || "Failed to delete short link.");
    }
  };

  // Filtered links for search query
  const filteredUrls = useMemo(() => {
    if (!searchQuery.trim()) return urls;
    const q = searchQuery.toLowerCase();
    return urls.filter(
      (u) =>
        u.short_code.toLowerCase().includes(q) ||
        (u.title && u.title.toLowerCase().includes(q)) ||
        u.original_url.toLowerCase().includes(q)
    );
  }, [urls, searchQuery]);

  // Computed KPI values
  const totalUrlsCount = urls.length;
  const activeUrlsCount = urls.filter((u) => u.is_active && !u.is_expired).length;

  const totalClicksCount = selectedUrlId
    ? specificUrlData?.total_clicks ?? specificUrlData?.kpis?.total_clicks ?? 0
    : overviewData?.total_clicks ?? urls.reduce((acc, curr) => acc + (curr.click_count || 0), 0);

  const clicksTodayCount = selectedUrlId
    ? specificUrlData?.kpis?.clicks_today ?? 0
    : recentClicks.filter((c) => {
        const d = new Date(c.clicked_at);
        const today = new Date();
        return d.toDateString() === today.toDateString();
      }).length;

  // Extracted timeline data
  const timelineData = selectedUrlId
    ? specificUrlData?.timeline || []
    : overviewData?.clicks_over_time || [];

  // Devices & breakdown data
  const devicesData = selectedUrlId
    ? specificUrlData?.devices || []
    : overviewData?.devices || [];

  const browsersData = selectedUrlId
    ? specificUrlData?.browsers || []
    : overviewData?.browsers || [];

  const operatingSystemsData = selectedUrlId
    ? specificUrlData?.operating_systems || []
    : [];

  const referralsData = selectedUrlId
    ? specificUrlData?.referrals || []
    : [];

  const countriesData = selectedUrlId
    ? specificUrlData?.countries || []
    : overviewData?.countries || [];

  const regionsData = selectedUrlId ? specificUrlData?.regions || [] : [];
  const citiesData = selectedUrlId ? specificUrlData?.cities || [] : [];

  const selectedLinkObj = urls.find((u) => u.id === selectedUrlId);

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex">
      {/* 1. Collapsible Left Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onOpenCreateModal={() => setCreateModalOpen(true)}
        totalLinksCount={totalUrlsCount}
      />

      {/* 2. Main Content Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Top Header */}
        <DashboardHeader
          onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          period={period}
          onPeriodChange={(newPeriod) => setPeriod(newPeriod)}
          searchQuery={searchQuery}
          onSearchChange={(val) => setSearchQuery(val)}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onCustomDateChange={(start, end) => {
            setCustomStartDate(start);
            setCustomEndDate(end);
            setPeriod("custom");
          }}
        />

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          {/* Header Action Bar & Subtitle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  {activeTab === "overview" && "Dashboard Overview"}
                  {activeTab === "links" && "My Short Links"}
                  {activeTab === "analytics" && "Advanced Analytics"}
                  {activeTab === "settings" && "Account & API Settings"}
                </h1>
                {selectedUrlId && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    Filtered: pulse.to/{selectedLinkObj?.short_code}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {activeTab === "overview" &&
                  "Track real-time redirect performance, visitor geography, and conversion analytics."}
                {activeTab === "links" &&
                  "Manage, inspect, toggle active status, and export shortened URLs."}
                {activeTab === "analytics" &&
                  "Granular telemetry breakdown across hardware, networks, and referral channels."}
                {activeTab === "settings" &&
                  "Configure profile information, edge rate limits, and custom domains."}
              </p>
            </div>

            {/* Quick Actions & URL Filter Reset */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {selectedUrlId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedUrlId(null)}
                  className="text-xs"
                >
                  Clear Filter
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={loadDashboardData}
                className="text-xs"
              >
                <RotateCw className="w-3.5 h-3.5 mr-1" />
                Refresh
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreateModalOpen(true)}
                className="text-xs shadow-md shadow-brand-500/20"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                New Link
              </Button>
            </div>
          </div>

          {/* SKELETON LOADER FOR INITIAL DATA */}
          {isLoading && !overviewData && !specificUrlData ? (
            <DashboardSkeleton />
          ) : (
            <>
              {/* ========================================================================= */}
              {/* TAB 1: OVERVIEW VIEW */}
              {/* ========================================================================= */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Quick Feature Banner for Advanced Filtering Studio */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-brand-950/40 via-slate-900 to-slate-950 border border-brand-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-400">
                        <SlidersHorizontal className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-white">
                          Multi-Dimensional Telemetry Filtering & Period Comparison
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Filter by URL, hardware device, country, state/region, or referral channel with automatic previous-period delta metrics.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleTabChange("analytics")}
                      className="text-xs shrink-0 self-start sm:self-auto shadow-md shadow-brand-500/20"
                    >
                      <Filter className="w-3.5 h-3.5 mr-1.5" />
                      Open Filter Studio
                    </Button>
                  </div>

                  {/* TOP SECTION: 4 ELEGANT KPI STAT CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Total URLs"
                      value={totalUrlsCount}
                      change={`${activeUrlsCount} active links`}
                      trend="up"
                      icon={Link2}
                      iconColor="text-cyanPulse-400"
                      subtitle="Pro workspace"
                    />

                    <StatCard
                      title="Total Clicks"
                      value={totalClicksCount}
                      change={period === "today" ? "Recorded today" : `Last ${period}`}
                      trend="up"
                      icon={MousePointerClick}
                      iconColor="text-brand-400"
                      subtitle="307 edge redirects"
                    />

                    <StatCard
                      title="Clicks Today"
                      value={clicksTodayCount}
                      change="Since 00:00 UTC"
                      trend={clicksTodayCount > 0 ? "up" : "neutral"}
                      icon={Zap}
                      iconColor="text-amber-400"
                      subtitle="Real-time velocity"
                    />

                    <StatCard
                      title="Active Links"
                      value={activeUrlsCount}
                      change={
                        totalUrlsCount > 0
                          ? `${Math.round((activeUrlsCount / totalUrlsCount) * 100)}% active`
                          : "100% active"
                      }
                      trend="up"
                      icon={ShieldCheck}
                      iconColor="text-emerald-400"
                      subtitle="Edge SLA 99.99%"
                    />
                  </div>

                  {/* 1. CLICKS OVER TIME CHART */}
                  <ClicksChart
                    data={timelineData}
                    period={period}
                    peakClicks={specificUrlData?.peak_clicks}
                    isLoading={isLoading}
                  />

                  {/* 2 & 3. DISTRIBUTION CHARTS (DEVICE + REFERRAL) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DeviceChart
                      devices={devicesData}
                      browsers={browsersData}
                      operatingSystems={operatingSystemsData}
                      isLoading={isLoading}
                    />

                    <ReferralChart
                      referrals={referralsData}
                      isLoading={isLoading}
                    />
                  </div>

                  {/* 4. GEOGRAPHIC ANALYTICS (NON-MAP RANKING) */}
                  <LocationTable
                    countries={countriesData}
                    regions={regionsData}
                    cities={citiesData}
                    isLoading={isLoading}
                  />

                  {/* 5 & 6. RECENT CLICKS TABLE & TOP PERFORMING LINKS TABLE */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TopLinksTable
                      links={topLinks.length > 0 ? topLinks : urls.slice(0, 5)}
                      onSelectLink={handleOpenAnalytics}
                      isLoading={isLoading}
                    />

                    <RecentClicksTable
                      clicks={recentClicks}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 1B: ADVANCED ANALYTICS FILTERING & COMPARISON STUDIO */}
              {/* ========================================================================= */}
              {activeTab === "analytics" && (
                <div className="space-y-6">
                  {/* 1. ADVANCED FILTER BAR */}
                  <AdvancedFilterBar
                    filters={advancedFilters}
                    onApplyFilters={handleApplyAdvancedFilters}
                    onClearFilters={handleClearAdvancedFilters}
                    onRemoveFilter={handleRemoveFilter}
                    filterOptions={filterOptions}
                    onExport={handleExportDataset}
                    isExporting={isExporting}
                    isLoading={isLoadingFiltered}
                  />

                  {/* 2. COMPARISON METRIC CARDS (CURRENT VS PREVIOUS PERIOD) */}
                  {advancedFilters.compare && (
                    <ComparisonMetricCards
                      comparison={filteredAnalytics?.comparison}
                      isLoading={isLoadingFiltered}
                    />
                  )}

                  {/* 3. 4 FILTERED KPI STAT CARDS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                      title="Filtered Clicks"
                      value={filteredAnalytics?.kpis?.total_clicks ?? 0}
                      change={advancedFilters.period === "today" ? "Recorded today" : `Last ${advancedFilters.period}`}
                      trend="neutral"
                      icon={MousePointerClick}
                      iconColor="text-brand-400"
                      subtitle="Matching database criteria"
                      isLoading={isLoadingFiltered}
                    />
                    <StatCard
                      title="Unique Visitors"
                      value={filteredAnalytics?.kpis?.unique_visitors ?? 0}
                      change="Distinct IP telemetry"
                      trend="neutral"
                      icon={Zap}
                      iconColor="text-cyanPulse-400"
                      subtitle="Deduplicated visitors"
                      isLoading={isLoadingFiltered}
                    />
                    <StatCard
                      title="Mobile Share"
                      value={`${filteredAnalytics?.kpis?.mobile_share_pct ?? 0}%`}
                      change={`${filteredAnalytics?.kpis?.mobile_clicks ?? 0} mobile clicks`}
                      trend="neutral"
                      icon={Smartphone}
                      iconColor="text-amber-400"
                      subtitle="Hardware distribution"
                      isLoading={isLoadingFiltered}
                    />
                    <StatCard
                      title="Referral Share"
                      value={`${filteredAnalytics?.kpis?.referral_share_pct ?? 0}%`}
                      change={`${filteredAnalytics?.kpis?.referral_clicks ?? 0} outbound referrers`}
                      trend="neutral"
                      icon={Globe2}
                      iconColor="text-emerald-400"
                      subtitle="Channel attribution"
                      isLoading={isLoadingFiltered}
                    />
                  </div>

                  {/* 4. CLICKS OVER TIME (FILTERED) */}
                  <ClicksChart
                    data={filteredAnalytics?.timeline || []}
                    period={advancedFilters.period}
                    isLoading={isLoadingFiltered}
                  />

                  {/* 5 & 6. DISTRIBUTION CHARTS (DEVICE + REFERRAL - FILTERED) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DeviceChart
                      devices={filteredAnalytics?.devices || []}
                      browsers={filteredAnalytics?.browsers || []}
                      operatingSystems={filteredAnalytics?.operating_systems || []}
                      isLoading={isLoadingFiltered}
                    />

                    <ReferralChart
                      referrals={filteredAnalytics?.referrals || []}
                      isLoading={isLoadingFiltered}
                    />
                  </div>

                  {/* 7. GEOGRAPHIC ANALYTICS (NON-MAP RANKING - FILTERED) */}
                  <LocationTable
                    countries={filteredAnalytics?.countries || []}
                    regions={filteredAnalytics?.regions || []}
                    cities={filteredAnalytics?.cities || []}
                    isLoading={isLoadingFiltered}
                  />

                  {/* 8. MATCHING EVENTS AUDIT LOG */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                      <span className="font-semibold text-white flex items-center gap-2">
                        Matching Telemetry Events
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-brand-500/20 text-brand-300 border border-brand-500/30">
                          {filteredAnalytics?.total_events ?? 0} records
                        </span>
                      </span>
                      <span className="font-mono text-[11px] text-slate-400">
                        Database SQL-filtered visitor click audit stream
                      </span>
                    </div>
                    <RecentClicksTable
                      clicks={filteredAnalytics?.events || []}
                      isLoading={isLoadingFiltered}
                    />
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* TAB 2: MY LINKS MANAGEMENT VIEW */}
              {/* ========================================================================= */}
              {activeTab === "links" && (
                <MyLinksView
                  urls={urls}
                  isLoading={isLoading}
                  onToggleStatus={handleToggleStatus}
                  onDeleteUrl={handleDeleteUrl}
                  onOpenAnalytics={handleOpenAnalytics}
                  onOpenCreateModal={() => setCreateModalOpen(true)}
                />
              )}

              {/* ========================================================================= */}
              {/* TAB 3: SETTINGS VIEW */}
              {/* ========================================================================= */}
              {activeTab === "settings" && (
                <div className="max-w-3xl space-y-6">
                  <Card className="p-6 rounded-2xl border-slate-800">
                    <h3 className="text-base font-semibold text-white mb-1">
                      Profile Information
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Your registered account details and identity.
                    </p>
                    <div className="space-y-3 text-xs">
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-slate-400">Full Name</span>
                        <span className="text-white font-medium">{user?.name}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className="text-slate-400">Email Address</span>
                        <span className="text-white font-mono">{user?.email}</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className="text-slate-400">Subscription Tier</span>
                        <Badge variant="brand">Pro Plan Active</Badge>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 rounded-2xl border-slate-800">
                    <h3 className="text-base font-semibold text-white mb-1">
                      Branded Custom Domain
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">
                      Short links are currently served via the global edge network on{" "}
                      <code className="text-brand-300 font-mono">pulse.to</code>.
                    </p>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                        <span className="font-mono text-white">pulse.to</span>
                      </div>
                      <span className="text-emerald-400 text-[11px] font-medium">
                        Active & Verified
                      </span>
                    </div>
                  </Card>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Quick Create Link Modal Dialog */}
      <CreateLinkModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onLinkCreated={handleLinkCreated}
      />
    </div>
  );
}
