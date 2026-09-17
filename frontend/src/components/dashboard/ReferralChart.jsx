import React from "react";
import {
  Share2,
  ExternalLink,
  Globe,
  Compass,
  ArrowUpRight,
} from "lucide-react";

/**
 * Helper to get recognizable badge for common referral domains
 */
function getReferralMeta(referrer = "") {
  const lower = referrer.toLowerCase();
  if (lower.includes("twitter") || lower.includes("t.co") || lower.includes("x.com")) {
    return { name: "Twitter / X", color: "bg-sky-500/15 text-sky-400 border-sky-500/30" };
  }
  if (lower.includes("linkedin")) {
    return { name: "LinkedIn", color: "bg-blue-500/15 text-blue-400 border-blue-500/30" };
  }
  if (lower.includes("google")) {
    return { name: "Google Search", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
  }
  if (lower.includes("github")) {
    return { name: "GitHub", color: "bg-purple-500/15 text-purple-400 border-purple-500/30" };
  }
  if (lower.includes("facebook") || lower.includes("instagram")) {
    return { name: "Meta / Instagram", color: "bg-pink-500/15 text-pink-400 border-pink-500/30" };
  }
  if (lower.includes("direct") || lower.includes("unknown")) {
    return { name: "Direct / SMS / Email", color: "bg-slate-700/30 text-slate-300 border-slate-700" };
  }
  return { name: referrer || "Other", color: "bg-slate-800 text-slate-300 border-slate-700" };
}

export default function ReferralChart({
  referrals = [],
  isLoading = false,
  className = "",
}) {
  const total = referrals.reduce((acc, curr) => acc + (curr.count || 0), 0);

  return (
    <div
      className={`saas-card p-6 border border-surface-border transition-all duration-200 flex flex-col justify-between ${className}`}
    >
      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Top Referral Sources
            </h3>
          </div>
          <Share2 className="w-4 h-4 text-brand-400" />
        </div>
        <p className="text-xs text-slate-400 mb-5">
          Websites, social networks, and channels driving redirect traffic.
        </p>
      </div>

      {isLoading ? (
        <div className="h-[220px] w-full flex items-center justify-center animate-pulse bg-slate-800/20 rounded-xl">
          <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        </div>
      ) : referrals.length === 0 || total === 0 ? (
        <div className="h-[220px] w-full flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
          <Compass className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-xs font-medium text-slate-400">No referral traffic recorded yet</p>
          <p className="text-[11px] text-slate-500 mt-1">Traffic will show when links are clicked via external websites.</p>
        </div>
      ) : (
        <div className="space-y-3.5 max-h-[230px] overflow-y-auto pr-1">
          {referrals.slice(0, 6).map((item) => {
            const meta = getReferralMeta(item.name);
            const percentage = item.percentage ?? (total > 0 ? ((item.count / total) * 100).toFixed(1) : 0);

            return (
              <div key={item.name} className="group">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-2 truncate pr-2">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${meta.color}`}
                    >
                      {meta.name}
                    </span>
                    <span className="text-slate-400 text-[11px] truncate group-hover:text-slate-300 transition-colors">
                      {item.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-white font-semibold">
                      {item.count.toLocaleString()}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
                      {percentage}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-500 to-cyanPulse-400 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(2, percentage))}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
