import React, { useState } from "react";
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import Button from "@/components/common/Button";

export default function CtaSection({ onOpenPricing }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      onOpenPricing();
      setSubmitted(false);
      setEmail("");
    }, 600);
  };

  return (
    <section className="py-20 md:py-28 bg-[#080b11] relative overflow-hidden">
      {/* Radial backlight glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-brand-600/20 via-cyanPulse-500/20 to-purple-600/20 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative saas-card p-8 sm:p-14 border border-brand-500/30 shadow-2xl text-center space-y-8">
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-semibold">
            <Zap className="w-3.5 h-3.5 text-cyanPulse-400" />
            <span>Ready in 30 Seconds • Free Forever Tier</span>
          </div>

          {/* Heading */}
          <div className="space-y-4 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Start turning every click into insight.
            </h2>
            <p className="text-sm sm:text-base text-slate-400">
              Join thousands of creators, marketing teams, and developers who rely on LinkPulse
              for sub-20ms edge redirects and real-time attribution.
            </p>
          </div>

          {/* Email Signup Bar */}
          <form
            onSubmit={handleSubmit}
            className="max-w-md mx-auto flex flex-col sm:flex-row items-center gap-2.5 p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-inner"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your work email..."
              required
              className="w-full bg-transparent border-none text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-0 px-3 py-2"
            />
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full sm:w-auto shrink-0"
              isLoading={submitted}
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Trust Guarantees */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 pt-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Free 1,000 links / month</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyanPulse-400" />
              <span>99.99% edge uptime SLA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
