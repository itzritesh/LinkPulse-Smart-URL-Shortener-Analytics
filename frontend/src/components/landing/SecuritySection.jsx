import React from "react";
import { Shield, Lock, AlertOctagon, Sliders, CheckCircle, Key } from "lucide-react";
import Badge from "@/components/common/Badge";

const SECURITY_PILLARS = [
  {
    icon: Lock,
    title: "Secure Links & SSL Enforcement",
    description:
      "All links are routed over strict TLS 1.3 encryption with automated certificate renewal. Custom domains receive dedicated SSL certificates automatically.",
    badge: "TLS 1.3 + HSTS",
    details: ["Automatic SSL provisioning", "Strict HTTPS redirection", "Zero insecure protocol fallback"],
  },
  {
    icon: AlertOctagon,
    title: "Real-Time Phishing & Malware Scanning",
    description:
      "Every destination URL is evaluated against global threat intelligence feeds before redirection. Malicious or deceptive destinations are quarantined immediately.",
    badge: "Automated Defense",
    details: ["Real-time threat engine checks", "Spam & phishing quarantine", "Destination reputation scoring"],
  },
  {
    icon: Sliders,
    title: "Intelligent Distributed Rate Limiting",
    description:
      "Protect your links and infrastructure from volumetric spam, click farms, and DDoS attempts using token-bucket rate limits enforced at edge PoPs.",
    badge: "Edge Protection",
    details: ["Token-bucket burst protection", "Click farm anomaly detection", "Per-IP & Per-Key quotas"],
  },
  {
    icon: Shield,
    title: "Privacy-Preserving Protected Analytics",
    description:
      "We strictly adhere to GDPR, CCPA, and PECR. Visitor IPs are cryptographically salted and hashed on the fly. No tracking cookies are ever injected into user sessions.",
    badge: "GDPR / CCPA Compliant",
    details: ["Cryptographic one-way hashing", "Zero third-party tracking cookies", "Fully anonymized click telemetry"],
  },
];

export default function SecuritySection() {
  return (
    <section id="security" className="py-20 md:py-28 bg-[#0a0e17] border-t border-slate-800/80 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="success">Enterprise-Grade Security</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Security and privacy baked into every redirect
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Engineered to meet the stringent security, compliance, and privacy mandates of
            modern organizations.
          </p>
        </div>

        {/* 4 Security Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {SECURITY_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="saas-card p-8 saas-card-hover border border-slate-800/80 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-inner">
                      <Icon className="w-6 h-6" />
                    </div>
                    <Badge variant="neutral" className="font-mono text-[11px]">
                      {pillar.badge}
                    </Badge>
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight">
                    {pillar.title}
                  </h3>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800/80 space-y-2">
                  {pillar.details.map((detail, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{detail}</span>
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
