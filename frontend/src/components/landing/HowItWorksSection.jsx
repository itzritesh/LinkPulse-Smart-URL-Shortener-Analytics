import React from "react";
import { Link2, Share2, BarChart3, ArrowRight, Check } from "lucide-react";
import Badge from "@/components/common/Badge";

const STEPS = [
  {
    step: "01",
    title: "Create",
    action: "Shorten & Brand",
    description:
      "Paste your destination URL and optionally designate a branded domain or custom slug (e.g. linkpulse.io/product-drop). Set link expiration and UTM parameters.",
    icon: Link2,
    preview: (
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-1.5 font-mono text-[11px]">
        <div className="text-slate-500">Destination:</div>
        <div className="text-slate-300 truncate">https://yourbrand.com/summer-sale?utm_source=x</div>
        <div className="pt-1 text-cyanPulse-300 font-bold flex items-center gap-1.5">
          <span>→ linkpulse.io/summer-sale</span>
          <span className="px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[9px] font-sans">
            Ready
          </span>
        </div>
      </div>
    ),
  },
  {
    step: "02",
    title: "Share",
    action: "Distribute Everywhere",
    description:
      "Deploy your clean, high-speed link across social campaigns, email sequences, video descriptions, and high-res dynamic vector QR codes.",
    icon: Share2,
    preview: (
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>Supported channels:</span>
          <span className="text-emerald-400 font-mono">Sub-20ms</span>
        </div>
        <div className="flex items-center gap-2">
          {["X / Twitter", "LinkedIn", "Email", "Print QR"].map((chan) => (
            <span
              key={chan}
              className="px-2 py-1 rounded-md bg-slate-800 text-[11px] text-slate-300 font-medium"
            >
              {chan}
            </span>
          ))}
        </div>
      </div>
    ),
  },
  {
    step: "03",
    title: "Analyze",
    action: "Inspect & Optimize",
    description:
      "Observe incoming clicks live. Audit device profiles, geographic distribution, referral pathways, and conversion trends with zero analytics delay.",
    icon: BarChart3,
    preview: (
      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Live Traffic Velocity:</span>
          <span className="font-mono text-cyanPulse-400 font-bold">1.2k clicks/hr</span>
        </div>
        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden flex">
          <div className="bg-brand-500 w-[55%]" />
          <div className="bg-cyanPulse-400 w-[30%]" />
          <div className="bg-emerald-500 w-[15%]" />
        </div>
        <div className="flex justify-between text-[10px] text-slate-500">
          <span>55% Mobile</span>
          <span>30% Desktop</span>
          <span>15% Tablet</span>
        </div>
      </div>
    ),
  },
];

export default function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-[#0a0e17] border-y border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="brand">Simple 3-Step Flow</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            How LinkPulse Works
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            From creation to real-time analytics attribution in less than 30 seconds.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="relative saas-card p-8 saas-card-hover flex flex-col justify-between space-y-6"
              >
                {/* Step indicator header */}
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-extrabold font-mono text-slate-600 group-hover:text-brand-400 transition-colors">
                    {step.step}
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-cyanPulse-400">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Step content */}
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider">
                    {step.action}
                  </div>
                  <h3 className="text-2xl font-bold text-white tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Preview Box */}
                <div className="pt-2">{step.preview}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
