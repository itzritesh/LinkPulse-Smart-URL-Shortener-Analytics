import React, { useState, useRef, useEffect } from "react";
import {
  Search,
  Calendar,
  Bell,
  ChevronDown,
  Menu,
  Check,
  ExternalLink,
  Shield,
  Zap,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";

export default function DashboardHeader({
  onToggleMobileSidebar,
  period = "30d",
  onPeriodChange,
  searchQuery = "",
  onSearchChange,
  customStartDate,
  customEndDate,
  onCustomDateChange,
}) {
  const { user, logout } = useAuth();

  const [dateDropdownOpen, setDateDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showCustomPicker, setShowCustomPicker] = useState(period === "custom");

  const [tempStart, setTempStart] = useState(customStartDate || "");
  const [tempEnd, setTempEnd] = useState(customEndDate || "");

  const dateRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dateRef.current && !dateRef.current.contains(e.target)) {
        setDateDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const periodLabels = {
    today: "Today",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    custom: "Custom Range",
  };

  const notifications = [
    {
      id: 1,
      title: "Traffic Spike Detected",
      desc: "Your link /react-docs received 50+ clicks from Twitter in the last hour.",
      time: "10m ago",
      unread: true,
    },
    {
      id: 2,
      title: "Custom Domain Pulse Active",
      desc: "pulse.to branded SSL certificate renewed across 12 edge locations.",
      time: "2h ago",
      unread: false,
    },
    {
      id: 3,
      title: "Analytics Snapshot Ready",
      desc: "Weekly performance report for your account is now available.",
      time: "1d ago",
      unread: false,
    },
  ];

  const handleApplyCustomDates = () => {
    if (tempStart && tempEnd && onCustomDateChange) {
      onCustomDateChange(tempStart, tempEnd);
      setDateDropdownOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#090d16]/80 backdrop-blur-xl border-b border-[#1c253b] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
      {/* Left: Mobile Sidebar Toggle & Search Input */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#141b2d] transition-colors"
          title="Open Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search with Shortcut Hint */}
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search links, tags, or domains..."
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-11 py-2 rounded-xl bg-[#0b0f1a] border border-[#1c253b] text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 transition-all shadow-inner"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
            <kbd className="text-[10px] font-mono bg-slate-800/80 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700/50">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls: Date Filter, Notifications, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Date Filter Dropdown */}
        <div className="relative" ref={dateRef}>
          <button
            onClick={() => setDateDropdownOpen(!dateDropdownOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141b2d] hover:bg-[#1a233b] active:scale-[0.98] border border-[#1c253b] hover:border-slate-600 text-xs text-slate-200 font-medium transition-all shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 text-brand-400" />
            <span className="hidden sm:inline">{periodLabels[period] || "Date Filter"}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dateDropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#141b2d] border border-[#1c253b] shadow-2xl p-2 z-50 animate-scale-in"
              style={{
                boxShadow: "inset 0 1px 0 0 rgba(255, 255, 255, 0.05), 0 16px 36px -4px rgba(0, 0, 0, 0.8)",
              }}
            >
              <div className="space-y-1">
                {[
                  { id: "today", label: "Today" },
                  { id: "7d", label: "Last 7 days" },
                  { id: "30d", label: "Last 30 days" },
                  { id: "custom", label: "Custom Date Range" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      if (opt.id === "custom") {
                        setShowCustomPicker(true);
                      } else {
                        setShowCustomPicker(false);
                        onPeriodChange(opt.id);
                        setDateDropdownOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      period === opt.id
                        ? "bg-brand-600/20 text-brand-300 font-semibold"
                        : "text-slate-300 hover:bg-slate-800/60"
                    }`}
                  >
                    <span>{opt.label}</span>
                    {period === opt.id && <Check className="w-3.5 h-3.5 text-brand-400" />}
                  </button>
                ))}
              </div>

              {/* Custom Date Inputs */}
              {showCustomPicker && (
                <div className="mt-3 pt-3 border-t border-slate-800 px-1 space-y-2">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={tempStart}
                      onChange={(e) => setTempStart(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">End Date</label>
                    <input
                      type="date"
                      value={tempEnd}
                      onChange={(e) => setTempEnd(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <button
                    onClick={handleApplyCustomDates}
                    disabled={!tempStart || !tempEnd}
                    className="w-full py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white font-medium text-xs mt-1 transition-colors"
                  >
                    Apply Range
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-slate-300 transition-colors shadow-sm"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-[#080b11]"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 px-1">
                <span className="text-xs font-semibold text-white">Notifications</span>
                <span className="text-[10px] text-brand-400 font-medium">Mark all read</span>
              </div>
              <div className="divide-y divide-slate-800/50 mt-1 max-h-64 overflow-y-auto">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 px-1 hover:bg-slate-800/30 rounded-lg transition-colors">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <span className="text-xs font-medium text-slate-200">{n.title}</span>
                      <span className="text-[10px] text-slate-500 shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-xs text-slate-200 transition-colors shadow-sm"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-brand-600 to-cyanPulse-400 flex items-center justify-center font-bold text-[11px] text-white">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <span className="font-medium hidden md:inline truncate max-w-[100px]">
              {user?.name || "Account"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
                <span className="mt-1.5 inline-block text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Pro Plan Active
                </span>
              </div>

              <div className="space-y-0.5">
                <Link
                  to="/"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  Public Landing Page
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
