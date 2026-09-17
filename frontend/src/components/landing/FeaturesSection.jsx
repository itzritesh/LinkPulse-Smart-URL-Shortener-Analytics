import React from "react";
import {
  Link2,
  BarChart3,
  Smartphone,
  Share2,
  Globe2,
  FolderKanban,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Card from "@/components/common/Card";
import Badge from "@/components/common/Badge";

const FEATURES = [
  {
    icon: Link2,
    badge: "Velocity",
    title: "Smart URL Shortening",
    description:
      "Transform long, unreadable query parameters into memorable branded vanity links with custom root domains and automated Base62 tokenization.",
    highlights: ["Custom branded domains", "vanity slug aliases", "configurable TTL expiration"],
    accent: "from-brand-500/20 to-indigo-500/5",
    iconColor: "text-brand-400",
    badgeVariant: "brand",
  },
  {
    icon: BarChart3,
    badge: "Real-Time",
    title: "Click Analytics",
    description:
      "Monitor incoming click traffic as it happens. Distinguish between human engagements, search engine crawlers, and automated bots.",
    highlights: ["Sub-second event stream", "Bot/crawler filtration", "UTM campaign tracking"],
    accent: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyanPulse-400",
    badgeVariant: "info",
  },
  {
    icon: Smartphone,
    badge: "Hardware & OS",
    title: "Device Insights",
    description:
      "Understand your audience’s hardware environment. Optimize landing page conversions by analyzing breakdown by mobile, tablet, desktop, and browser.",
    highlights: ["Mobile vs Desktop share", "Browser engine detection", "OS version telemetry"],
    accent: "from-purple-500/20 to-purple-500/5",
    iconColor: "text-purple-400",
    badgeVariant: "neutral",
  },
  {
    icon: Share2,
    badge: "Attribution",
    title: "Referral Tracking",
    description:
      "Trace traffic origins with high fidelity. Track social shares across Twitter/X, LinkedIn, Discord, and newsletters to maximize campaign ROI.",
    highlights: ["Social media channels", "Direct vs Organic", "Multi-touch campaign tags"],
    accent: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
    badgeVariant: "success",
  },
  {
    icon: Globe2,
    badge: "Global",
    title: "Geographic Analytics",
    description:
      "Identify global hotspots with country and city-level accuracy. Plan localized marketing pushes around regional peak activity times.",
    highlights: ["Country & city resolution", "Timezone distribution", "Regional peak heatmaps"],
    accent: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
    badgeVariant: "warning",
  },
  {
    icon: FolderKanban,
    badge: "Productivity",
    title: "Link Management",
    description:
      "Organize thousands of URLs with tags, workspaces, and bulk search. Generate downloadable high-resolution vector QR codes in seconds.",
    highlights: ["Dynamic QR generation", "CSV/JSON bulk export", "Tags & link archiving"],
    accent: "from-blue-500/20 to-blue-500/5",
    iconColor: "text-blue-400",
    badgeVariant: "brand",
  },
];

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 md:py-28 bg-[#080b11] relative bg-radial-section">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="brand">Engineered for Scale</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Everything you need to govern and scale your links
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Built from the ground up for high-velocity marketing, content distribution,
            and developer reliability.
          </p>
        </div>

        {/* Feature 6-Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative saas-card p-7 saas-card-hover flex flex-col justify-between"
              >
                {/* Accent top glow */}
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${feature.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none`}
                />

                <div className="relative space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shadow-inner">
                      <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                    </div>
                    <Badge variant={feature.badgeVariant}>{feature.badge}</Badge>
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-cyanPulse-300 transition-colors">
                    {feature.title}
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="relative pt-6 mt-6 border-t border-slate-800/80 space-y-2">
                  {feature.highlights.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyanPulse-400 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
