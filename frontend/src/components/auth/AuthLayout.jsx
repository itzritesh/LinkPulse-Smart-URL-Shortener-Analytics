import React from "react";
import { Link } from "react-router-dom";
import { Link2, ArrowLeft, ShieldCheck, Zap, Star, Activity } from "lucide-react";
import Badge from "@/components/common/Badge";

export default function AuthLayout({
  title,
  subtitle,
  children,
  switchText,
  switchActionText,
  switchActionTo,
}) {
  return (
    <div className="min-h-screen w-full flex bg-surface-canvas text-slate-100">
      {/* Left Column: Visual Brand Showcase (visible on lg+) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 lg:p-16 border-r border-surface-border bg-gradient-to-br from-surface-card via-surface-canvas to-[#06080e] overflow-hidden">
        {/* Background glow flares */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-brand-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top: Brand Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-400 flex items-center justify-center shadow-card shadow-brand-500/20 group-hover:scale-105 transition-transform duration-200">
              <Link2 className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              Link<span className="text-brand-400">Pulse</span>
            </span>
          </Link>
        </div>

        {/* Middle: Headline & Testimonial */}
        <div className="relative z-10 space-y-8 max-w-lg">
          <div className="space-y-3">
            <Badge variant="brand">Unified Link Intelligence</Badge>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Turn every click into measurable business insight.
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Join growth teams and developers using LinkPulse for sub-20ms edge redirects,
              bot-filtered attribution, and live campaign telemetry.
            </p>
          </div>

          {/* Customer Quote Box */}
          <div className="p-6 rounded-2xl bg-surface-card/80 border border-surface-border shadow-card space-y-3.5">
            <div className="flex items-center gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed">
              “LinkPulse replaced three separate analytics tools for our marketing stack.
              The sub-20ms edge redirects and real-time geographic breakdown are game changers.”
            </p>
            <div className="flex items-center gap-3 pt-1">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center font-bold text-white text-xs">
                SL
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Sarah Lin</p>
                <p className="text-[11px] text-slate-400">VP of Growth, HyperScale SaaS</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom: Infrastructure Trust Strip */}
        <div className="relative z-10 flex items-center gap-6 text-xs text-slate-400 border-t border-surface-border pt-6">
          <div className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>99.99% Uptime SLA</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-brand-400" />
            <span>Sub-20ms Latency</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-brand-400" />
            <span>GDPR Compliant</span>
          </div>
        </div>
      </div>

      {/* Right Column: Form Area */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-12 lg:p-16 overflow-y-auto bg-surface-canvas">
        {/* Back Link */}
        <div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to LinkPulse home</span>
          </Link>
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-8 space-y-6">
          {/* Header */}
          <div className="space-y-1.5 text-left">
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {title}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">{subtitle}</p>
          </div>

          {/* Form Content */}
          <div className="saas-card p-6 sm:p-8 border border-surface-border shadow-card">
            {children}
          </div>

          {/* Switch Action Link */}
          {switchText && (
            <p className="text-center text-xs text-slate-400">
              {switchText}{" "}
              <Link
                to={switchActionTo}
                className="font-semibold text-brand-400 hover:text-brand-300 underline transition-colors"
              >
                {switchActionText}
              </Link>
            </p>
          )}
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500">
          Protected by TLS 1.3 encryption • LinkPulse Security
        </div>
      </div>
    </div>
  );
}
