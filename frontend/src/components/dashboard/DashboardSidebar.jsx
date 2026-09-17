import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Link2,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  Zap,
  X,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Badge from "@/components/common/Badge";

export default function DashboardSidebar({
  activeTab = "overview",
  onTabChange,
  isOpen = false,
  onClose,
  onOpenCreateModal,
  totalLinksCount = 0,
}) {
  const { user, logout } = useAuth();

  const navItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "links", label: "My Links", icon: Link2, badge: totalLinksCount },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0c101c] border-r border-[#1c253b] flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className="h-16 flex items-center justify-between px-5 border-b border-[#1c253b]/80">
            <Link to="/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform border border-white/10">
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                  LinkPulse
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-brand-500/15 text-brand-300 border border-brand-500/25">
                    Pro
                  </span>
                </span>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Action Button: Create New Link */}
          <div className="p-3.5">
            <button
              onClick={() => {
                if (onOpenCreateModal) onOpenCreateModal();
                if (onClose) onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs shadow-[0_1px_2px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.2)] border border-brand-500/60 transition-all duration-150 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Short Link</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-2.5 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (onTabChange) onTabChange(item.id);
                    if (onClose) onClose();
                  }}
                  className={`relative w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group active:scale-[0.98] ${
                    isActive
                      ? "bg-[#141b2d] text-white border border-[#1c253b] shadow-sm"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#111728]"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-brand-500" />
                  )}

                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`w-4 h-4 transition-colors ${
                        isActive
                          ? "text-brand-400"
                          : "text-slate-500 group-hover:text-slate-300"
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-mono ${
                        isActive
                          ? "bg-brand-500/20 text-brand-300 font-semibold"
                          : "bg-slate-800/80 text-slate-400"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Plan & Profile Section */}
        <div className="p-4 border-t border-[#1c253b]/80 space-y-3">
          {/* Storage / Quota Card */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-400 font-medium">Link Quota</span>
              <span className="text-emerald-400 font-mono font-medium">Unlimited</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full w-1/4 bg-brand-500 rounded-full"></div>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Pro Member • 99.99% Edge SLA
            </span>
          </div>

          {/* User Row & Logout */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-xs font-bold text-brand-300 shrink-0">
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user?.name || "Member"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {user?.email || "user@linkpulse.io"}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
