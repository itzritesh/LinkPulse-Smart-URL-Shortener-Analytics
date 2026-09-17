import React, { useState, useEffect } from "react";
import { Activity, Globe, Zap, ArrowUpRight, Smartphone, Laptop, Tablet } from "lucide-react";
import Badge from "@/components/common/Badge";

const INITIAL_PINGS = [
  {
    id: 1,
    city: "San Francisco, US",
    device: "Desktop",
    browser: "Chrome",
    latency: "14ms",
    timeAgo: "1s ago",
    code: "pulse.to/launch",
  },
  {
    id: 2,
    city: "London, UK",
    device: "Mobile",
    browser: "Safari",
    latency: "22ms",
    timeAgo: "3s ago",
    code: "pulse.to/deck-25",
  },
  {
    id: 3,
    city: "Tokyo, JP",
    device: "Mobile",
    browser: "Edge",
    latency: "19ms",
    timeAgo: "6s ago",
    code: "pulse.to/promo",
  },
  {
    id: 4,
    city: "Berlin, DE",
    device: "Desktop",
    browser: "Firefox",
    latency: "16ms",
    timeAgo: "8s ago",
    code: "pulse.to/launch",
  },
];

export default function HeroVisualization() {
  const [clickCount, setClickCount] = useState(148920);

  // Subtle live pulse increment to simulate active global clicks
  useEffect(() => {
    const interval = setInterval(() => {
      setClickCount((prev) => prev + Math.floor(Math.random() * 3) + 1);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-lg mx-auto lg:max-w-none">
      {/* Background ambient glow behind card */}
      <div className="absolute -inset-1 bg-gradient-to-r from-brand-600/30 via-cyanPulse-500/20 to-indigo-600/30 rounded-3xl blur-2xl opacity-50 -z-10" />

      <div className="saas-card border border-slate-800/90 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header with Live Ping Indicator */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-center justify-center text-brand-400">
              <Activity className="w-5 h-5 animate-pulse text-cyanPulse-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Global Click Stream</span>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Sub-20ms edge redirects active</p>
            </div>
          </div>
          <Badge variant="info" className="font-mono text-[11px]">
            ⚡ 18ms avg
          </Badge>
        </div>

        {/* Counter KPI Strip */}
        <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-[#090d15] border border-slate-800/80 text-center">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Clicks (24h)
            </span>
            <span className="text-base sm:text-lg font-extrabold text-white font-mono">
              {clickCount.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Global CDN
            </span>
            <span className="text-base sm:text-lg font-extrabold text-cyanPulse-400 font-mono">
              310+ PoPs
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Uptime SLA
            </span>
            <span className="text-base sm:text-lg font-extrabold text-emerald-400 font-mono">
              99.99%
            </span>
          </div>
        </div>

        {/* Live Incoming Click Feed */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-medium">Recent Visitor Pings</span>
            <span className="text-[11px] text-slate-500">Live WebSockets</span>
          </div>

          <div className="space-y-2">
            {INITIAL_PINGS.map((ping) => (
              <div
                key={ping.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/80 transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0">
                    {ping.device === "Mobile" ? (
                      <Smartphone className="w-3.5 h-3.5 text-cyanPulse-400" />
                    ) : (
                      <Laptop className="w-3.5 h-3.5 text-brand-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-200 truncate">{ping.city}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {ping.browser} • <code className="text-brand-300">{ping.code}</code>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-mono text-emerald-400 text-[11px] block">
                    {ping.latency}
                  </span>
                  <span className="text-[10px] text-slate-500">{ping.timeAgo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mini Sparkline Bar Decorative Row */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[11px]">Real-time telemetry verified</span>
          <div className="flex items-end gap-1 h-5">
            {[40, 65, 30, 80, 95, 60, 85, 100, 75, 90, 110, 85, 95, 120].map((h, i) => (
              <span
                key={i}
                style={{ height: `${h * 0.15}px` }}
                className={`w-1 rounded-full ${
                  i > 10
                    ? "bg-cyanPulse-400 animate-pulse"
                    : i > 6
                    ? "bg-brand-500"
                    : "bg-slate-700"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
