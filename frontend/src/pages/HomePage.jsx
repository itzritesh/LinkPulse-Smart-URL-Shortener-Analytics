import React from "react";
import HeroSection from "@/components/landing/HeroSection";
import BrowserMockupDashboard from "@/components/landing/BrowserMockupDashboard";
import FeaturesSection from "@/components/landing/FeaturesSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import AnalyticsShowcase from "@/components/landing/AnalyticsShowcase";
import SecuritySection from "@/components/landing/SecuritySection";
import CtaSection from "@/components/landing/CtaSection";

export default function HomePage({ onOpenPricing }) {
  return (
    <div className="space-y-4">
      {/* 1. Hero Section with Interactive Shortener & Decorative Visualization */}
      <HeroSection onOpenPricing={onOpenPricing} />

      {/* 2. Interactive Product Preview inside Browser Frame */}
      <BrowserMockupDashboard />

      {/* 3. 6 Core Features Section */}
      <FeaturesSection />

      {/* 4. How It Works (Create -> Share -> Analyze) */}
      <HowItWorksSection />

      {/* 5. Analytics Showcase with Interactive Recharts */}
      <AnalyticsShowcase />

      {/* 6. Security & Compliance Architecture */}
      <SecuritySection />

      {/* 7. Conversion CTA Banner */}
      <CtaSection onOpenPricing={onOpenPricing} />
    </div>
  );
}
