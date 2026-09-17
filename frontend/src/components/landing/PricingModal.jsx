import React, { useState } from "react";
import { X, Check, Zap, Shield, Sparkles } from "lucide-react";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";

export default function PricingModal({ isOpen, onClose }) {
  const [isAnnual, setIsAnnual] = useState(true);

  if (!isOpen) return null;

  const tiers = [
    {
      name: "Starter",
      badge: "Free Forever",
      price: "$0",
      period: "forever",
      description: "Perfect for indie creators and side projects testing link analytics.",
      features: [
        "Up to 1,000 links / month",
        "30-day analytics retention",
        "Standard redirect speed (<50ms)",
        "Basic device & country breakdown",
        "Community support",
      ],
      cta: "Get Started Free",
      variant: "secondary",
      popular: false,
    },
    {
      name: "Pro Growth",
      badge: "Most Popular",
      price: isAnnual ? "$19" : "$24",
      period: "/ month",
      description: "For scaling creators, growth teams, and startups needing full visibility.",
      features: [
        "Unlimited short links",
        "Unlimited analytics retention",
        "Custom branded domains (up to 5)",
        "Real-time click velocity stream",
        "City-level geolocation & UTM tags",
        "Dynamic SVG/PNG QR Code generator",
        "Priority email & chat support",
      ],
      cta: "Start 14-Day Free Trial",
      variant: "primary",
      popular: true,
    },
    {
      name: "Enterprise",
      badge: "Dedicated Infrastructure",
      price: isAnnual ? "$79" : "$99",
      period: "/ month",
      description: "For high-volume applications requiring sub-10ms redirects and SLA.",
      features: [
        "Everything in Pro",
        "Edge global CDN redirects (<10ms)",
        "Unlimited custom domains",
        "Raw click data export (CSV/JSON/S3)",
        "SSO, SAML & role-based team access",
        "Custom SLA & 99.99% uptime guarantee",
        "Dedicated account manager",
      ],
      cta: "Contact Enterprise Sales",
      variant: "secondary",
      popular: false,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#0d121c] border border-slate-700/80 rounded-3xl p-6 sm:p-10 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-400"
          aria-label="Close pricing modal"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-8">
          <Badge variant="brand" className="mb-2">
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Simple, predictable pricing for every link
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Scale your links without hidden fees or surprise overages. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-1 rounded-xl bg-slate-900 border border-slate-800 mt-4">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                !isAnnual
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Monthly billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                isAnnual
                  ? "bg-brand-500 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Annual billing
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col justify-between p-6 sm:p-8 rounded-2xl border transition-all ${
                tier.popular
                  ? "bg-gradient-to-b from-brand-950/40 via-slate-900 to-slate-900/90 border-brand-500/50 shadow-xl shadow-brand-500/10"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-brand-500 to-cyanPulse-500 text-white shadow-md">
                    Recommended
                  </span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                  <Badge variant={tier.popular ? "brand" : "neutral"}>
                    {tier.badge}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 min-h-[36px]">{tier.description}</p>

                <div className="my-6">
                  <span className="text-4xl font-extrabold text-white tracking-tight">
                    {tier.price}
                  </span>
                  <span className="text-xs text-slate-400 ml-1.5">{tier.period}</span>
                </div>

                <div className="border-t border-slate-800 pt-6 space-y-3">
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Included features:
                  </p>
                  <ul className="space-y-2.5 text-xs text-slate-300">
                    {tier.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-cyanPulse-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="pt-8 mt-auto">
                <Button
                  variant={tier.variant}
                  className="w-full"
                  size="md"
                  onClick={onClose}
                >
                  {tier.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
