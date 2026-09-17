import React from "react";
import { Link } from "react-router-dom";
import {
  ExternalLink,
  BarChart3,
  TrendingUp,
  Link2,
  Trophy,
} from "lucide-react";
import CopyButton from "@/components/urls/CopyButton";
import LinkStatusBadge from "@/components/urls/LinkStatusBadge";
import { formatRelativeTime } from "@/utils/formatters";

export default function TopLinksTable({
  links = [],
  onSelectLink,
  isLoading = false,
  className = "",
}) {
  const backendBaseUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  return (
    <div
      className={`p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm transition-all duration-200 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-white tracking-tight">
              Top Performing Links
            </h3>
            <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <Trophy className="w-3 h-3" />
              Highest Conversion
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Your most clicked URLs ranked by lifetime and period redirect volume.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-[200px] w-full flex items-center justify-center animate-pulse bg-slate-800/20 rounded-xl">
          <div className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin"></div>
        </div>
      ) : links.length === 0 ? (
        <div className="h-[180px] w-full flex flex-col items-center justify-center text-center p-6 rounded-xl border border-dashed border-slate-800 bg-slate-900/30">
          <Link2 className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-xs font-medium text-slate-400">No active links yet</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Create your first short URL to track click performance and conversions.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium text-[11px] uppercase tracking-wider">
                <th className="pb-3 font-medium w-10">#</th>
                <th className="pb-3 font-medium">Link & Vanity Slug</th>
                <th className="pb-3 font-medium hidden md:table-cell">Destination</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-right">Clicks</th>
                <th className="pb-3 font-medium text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {links.map((link, idx) => {
                const rank = idx + 1;
                const fullShortUrl = `${backendBaseUrl}/${link.short_code}`;

                return (
                  <tr
                    key={link.id}
                    className="hover:bg-slate-800/30 transition-colors group"
                  >
                    {/* Rank */}
                    <td className="py-3 pr-2">
                      <span
                        className={`w-5 h-5 rounded flex items-center justify-center text-[11px] font-mono font-bold ${
                          rank === 1
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : rank === 2
                            ? "bg-slate-400/20 text-slate-200 border border-slate-400/30"
                            : rank === 3
                            ? "bg-amber-700/20 text-amber-400 border border-amber-700/30"
                            : "text-slate-500"
                        }`}
                      >
                        {rank}
                      </span>
                    </td>

                    {/* Short Link */}
                    <td className="py-3 pr-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-100 hover:text-brand-300 transition-colors">
                            pulse.to/{link.short_code}
                          </span>
                        </div>
                        {link.title && (
                          <span className="text-[11px] text-slate-400 truncate max-w-[180px] mt-0.5">
                            {link.title}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Destination */}
                    <td className="py-3 pr-3 hidden md:table-cell">
                      <a
                        href={link.original_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1 truncate max-w-[200px]"
                      >
                        <span className="truncate">{link.original_url}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                      </a>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-2 text-center">
                      <LinkStatusBadge
                        isActive={link.is_active}
                        isExpired={link.is_expired}
                      />
                    </td>

                    {/* Total Clicks */}
                    <td className="py-3 pr-3 text-right">
                      <span className="font-mono font-bold text-white text-sm">
                        {(link.clicks ?? link.click_count ?? 0).toLocaleString()}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <CopyButton textToCopy={fullShortUrl} size="sm" />
                        {onSelectLink && (
                          <button
                            onClick={() => onSelectLink(link)}
                            title="Inspect Detailed Analytics"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-slate-800 transition-colors"
                          >
                            <BarChart3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
