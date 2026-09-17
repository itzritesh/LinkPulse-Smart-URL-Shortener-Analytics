import React from "react";
import {
  Laptop,
  Smartphone,
  Tablet,
  Globe2,
  Clock,
  ExternalLink,
  ShieldCheck,
  MousePointerClick,
} from "lucide-react";
import { formatRelativeTime } from "@/utils/formatters";

function getDeviceIcon(device = "") {
  const d = device.toLowerCase();
  if (d.includes("mobile")) return <Smartphone className="w-3.5 h-3.5 text-cyanPulse-400" />;
  if (d.includes("tablet")) return <Tablet className="w-3.5 h-3.5 text-purple-400" />;
  return <Laptop className="w-3.5 h-3.5 text-brand-400" />;
}

export default function RecentClicksTable({
  clicks = [],
  isLoading = false,
  className = "",
}) {
  return (
    <div
      className={`p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Recent Visitor Clicks
            </h3>
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Privacy-safe click stream without exposing raw visitor IP addresses.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[200px] w-full flex items-center justify-center animate-pulse bg-slate-800/20 rounded-xl">
          <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        </div>
      ) : clicks.length === 0 ? (
        <div className="h-[180px] w-full flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
          <MousePointerClick className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-xs font-medium text-slate-400">No clicks recorded yet</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            When visitors access your shortened URLs, real-time events appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-medium">Link</th>
                <th className="pb-3 font-medium">Device & Browser</th>
                <th className="pb-3 font-medium">Location</th>
                <th className="pb-3 font-medium">Referrer</th>
                <th className="pb-3 font-medium text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {clicks.map((event) => (
                <tr
                  key={event.id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  {/* Short Link */}
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-medium text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 group-hover:border-brand-500/40 transition-colors">
                        /{event.short_code || `link-${event.url_id}`}
                      </span>
                    </div>
                  </td>

                  {/* Device & Browser */}
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-1.5">
                      {getDeviceIcon(event.device_type)}
                      <span className="text-slate-200 font-medium">
                        {event.browser || "Unknown Browser"}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        • {event.device_type || "Desktop"}
                      </span>
                    </div>
                  </td>

                  {/* Approximate Location */}
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Globe2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate max-w-[140px]">
                        {event.city && event.country
                          ? `${event.city}, ${event.country}`
                          : event.country || "Approx. Location"}
                      </span>
                    </div>
                  </td>

                  {/* Referrer */}
                  <td className="py-3 pr-3">
                    <span className="text-slate-400 truncate max-w-[130px] block">
                      {event.referrer || "Direct"}
                    </span>
                  </td>

                  {/* Timestamp */}
                  <td className="py-3 text-right font-mono text-slate-400 whitespace-nowrap">
                    {formatRelativeTime(event.clicked_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
