import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Link2, Menu, X, ArrowRight, Activity, LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import Button from "@/components/common/Button";
import StatusIndicator from "@/components/feedback/StatusIndicator";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

export default function Navbar({ onOpenPricing }) {
  const { health, isLoadingHealth } = useApp();
  const { user, isAuthenticated, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const statusType = health
    ? health.status === "healthy"
      ? "healthy"
      : "degraded"
    : isLoadingHealth
    ? "degraded"
    : "offline";

  const navLinks = [
    { name: "Product", href: "/#analytics-preview" },
    { name: "Features", href: "/#features" },
    { name: "How it works", href: "/#how-it-works" },
    { name: "Analytics", href: "/#analytics" },
    { name: "Security", href: "/#security" },
  ];

  const handleSignOut = () => {
    logout();
    toast.info("Signed out successfully.");
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#080b11]/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-cyanPulse-500 flex items-center justify-center shadow-lg shadow-brand-500/25 group-hover:scale-105 transition-transform duration-200">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Link<span className="text-cyanPulse-400">Pulse</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="hover:text-white transition-colors duration-150"
              >
                {link.name}
              </a>
            ))}
            <button
              onClick={onOpenPricing}
              className="hover:text-white transition-colors duration-150 font-medium cursor-pointer"
            >
              Pricing
            </button>
          </nav>

          {/* Right Action CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {/* Live API Health indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <StatusIndicator
                status={statusType}
                label={health?.status === "healthy" ? "API Live" : "Offline"}
              />
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/dashboard">
                  <Button variant="secondary" size="sm" className="gap-2">
                    <LayoutDashboard className="w-4 h-4 text-cyanPulse-400" />
                    <span>Dashboard</span>
                  </Button>
                </Link>

                <div className="flex items-center gap-2 pl-1 border-l border-slate-800">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-500 to-cyan-500 flex items-center justify-center font-bold text-white text-xs">
                    {user?.name ? user.name[0].toUpperCase() : "U"}
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-300 hover:text-white px-3 py-2 transition-colors"
                >
                  Login
                </Link>

                <Link to="/register">
                  <Button variant="primary" size="sm">
                    <span>Get Started</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger */}
          <div className="flex md:hidden items-center gap-3">
            <StatusIndicator status={statusType} showLabel={false} />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-400 hover:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-white" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-[#0d121c] px-4 pt-4 pb-6 space-y-4 animate-fade-in shadow-2xl">
          <div className="space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="block py-2 text-sm font-medium text-slate-300 hover:text-white"
              >
                {link.name}
              </a>
            ))}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenPricing();
              }}
              className="block w-full text-left py-2 text-sm font-medium text-slate-300 hover:text-white"
            >
              Pricing
            </button>
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            {isAuthenticated ? (
              <>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-brand-500 flex items-center justify-center text-xs font-bold text-white">
                      {user?.name ? user.name[0].toUpperCase() : "U"}
                    </div>
                    <span className="text-xs font-semibold text-white truncate max-w-[160px]">
                      {user?.name}
                    </span>
                  </div>
                  <Badge variant="brand">Active</Badge>
                </div>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button variant="primary" className="w-full" size="md">
                    Go to Dashboard
                  </Button>
                </Link>
                <Button
                  variant="secondary"
                  className="w-full text-rose-400"
                  size="md"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button variant="secondary" className="w-full" size="md">
                    Login
                  </Button>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full"
                >
                  <Button variant="primary" className="w-full" size="md">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
