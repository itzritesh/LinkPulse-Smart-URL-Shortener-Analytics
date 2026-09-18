import React, { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import DashboardPage from "@/pages/DashboardPage";
import LinkAnalyticsPage from "@/pages/LinkAnalyticsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import RedirectPage from "@/pages/RedirectPage";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PricingModal from "@/components/landing/PricingModal";

function AppContent() {
  const [pricingOpen, setPricingOpen] = useState(false);
  const location = useLocation();

  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";
  const isDashboardPage = location.pathname.startsWith("/dashboard");
  const isRedirectPage = !isAuthPage && !isDashboardPage && location.pathname !== "/" && !location.pathname.startsWith("/not-found");
  const showPublicNav = !isAuthPage && !isDashboardPage && !isRedirectPage;

  return (
    <div className="min-h-screen flex flex-col bg-[#080b11] text-slate-100 selection:bg-brand-500/30 selection:text-brand-200">
      {/* Show landing navbar only on public pages */}
      {showPublicNav && (
        <Navbar onOpenPricing={() => setPricingOpen(true)} />
      )}

      <main className="flex-1 w-full">
        <Routes>
          <Route
            path="/"
            element={<HomePage onOpenPricing={() => setPricingOpen(true)} />}
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard/analytics/:urlId"
            element={
              <ProtectedRoute>
                <LinkAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/r/:shortCode" element={<RedirectPage />} />
          <Route path="/:shortCode" element={<RedirectPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Show footer only on public pages */}
      {showPublicNav && (
        <Footer onOpenPricing={() => setPricingOpen(true)} />
      )}

      {/* Global Pricing Modal */}
      <PricingModal
        isOpen={pricingOpen}
        onClose={() => setPricingOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
