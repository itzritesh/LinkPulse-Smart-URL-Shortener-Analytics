import React, { useState } from "react";
import {
  Link2,
  Search,
  Trash2,
  Power,
  ExternalLink,
  Calendar,
  MousePointer,
  AlertTriangle,
  RotateCw,
} from "lucide-react";
import CopyButton from "./CopyButton";
import LinkStatusBadge from "./LinkStatusBadge";
import Button from "@/components/common/Button";
import LoadingSpinner from "@/components/feedback/LoadingSpinner";
import { formatDate } from "@/utils/formatters";

export default function UrlTable({
  urls = [],
  isLoading = false,
  onToggleStatus,
  onDeleteUrl,
  onRefresh,
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterActive, setFilterActive] = useState("all");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Filter links by search and active filter
  const filteredUrls = urls.filter((url) => {
    const matchesSearch =
      url.original_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.short_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (url.title && url.title.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterActive === "active") return url.is_active && !url.is_expired;
    if (filterActive === "paused") return !url.is_active;
    if (filterActive === "expired") return url.is_expired;

    return true;
  });

  return (
    <div className="saas-card border border-slate-800 shadow-2xl overflow-hidden space-y-4">
      {/* Table Header / Search & Filter Controls */}
      <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by title, URL or code..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-400"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Status Filter Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            {["all", "active", "paused"].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilterActive(tab)}
                className={`px-3 py-1 rounded-lg capitalize font-semibold transition-all ${
                  filterActive === tab
                    ? "bg-brand-500 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            title="Refresh links"
            className="p-2"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
          </Button>
        </div>
      </div>

      {/* Loading Spinner State */}
      {isLoading ? (
        <div className="py-12">
          <LoadingSpinner size="md" text="Loading your short links..." />
        </div>
      ) : filteredUrls.length === 0 ? (
        /* Empty State */
        <div className="py-16 text-center px-4 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500">
            <Link2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-300">
            {searchTerm ? "No matching short links found" : "No short links created yet"}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchTerm
              ? "Try searching for a different URL query or clear your filter."
              : "Paste your first long URL in the form above to generate a trackable short link."}
          </p>
        </div>
      ) : (
        /* Table / List */
        <div className="divide-y divide-slate-800/60">
          {filteredUrls.map((url) => (
            <div
              key={url.id}
              className="p-5 hover:bg-slate-900/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 text-left"
            >
              {/* Left Details */}
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h4 className="font-semibold text-white text-sm truncate max-w-xs sm:max-w-md">
                    {url.title || "Untitled Link"}
                  </h4>
                  <LinkStatusBadge
                    isActive={url.is_active}
                    expiresAt={url.expires_at}
                  />
                  {url.expires_at && (
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Expires: {formatDate(url.expires_at)}
                    </span>
                  )}
                </div>

                {/* Short Code & Original URL */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <a
                    href={url.short_url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono font-bold text-cyanPulse-300 hover:underline flex items-center gap-1 truncate"
                  >
                    <span>{url.short_url}</span>
                    <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                  </a>
                  <span className="text-slate-600 hidden sm:inline">•</span>
                  <span className="text-slate-400 font-mono truncate max-w-xs text-[11px]">
                    {url.original_url}
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 pt-0.5">
                  Created {formatDate(url.created_at)}
                </div>
              </div>

              {/* Right Metrics & Actions */}
              <div className="flex items-center justify-between md:justify-end gap-5 shrink-0 pt-2 md:pt-0 border-t border-slate-800/40 md:border-none">
                {/* Click Counter */}
                <div className="text-right">
                  <div className="text-base font-extrabold font-mono text-white flex items-center gap-1.5 justify-end">
                    <MousePointer className="w-3.5 h-3.5 text-cyanPulse-400" />
                    <span>{url.click_count.toLocaleString()}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Total Clicks
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  <CopyButton text={url.short_url} />

                  {/* Toggle Status Switch */}
                  <button
                    onClick={() => onToggleStatus(url.id, !url.is_active)}
                    className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      url.is_active
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}
                    title={url.is_active ? "Pause link" : "Activate link"}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button with inline confirm */}
                  {deleteConfirmId === url.id ? (
                    <div className="flex items-center gap-1 animate-fade-in">
                      <button
                        onClick={() => {
                          onDeleteUrl(url.id);
                          setDeleteConfirmId(null);
                        }}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(url.id)}
                      className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700/60 transition-colors"
                      title="Delete link"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
