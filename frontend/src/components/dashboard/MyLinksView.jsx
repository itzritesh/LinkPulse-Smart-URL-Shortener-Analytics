import React, { useState, useMemo } from "react";
import {
  Search,
  SlidersHorizontal,
  ExternalLink,
  BarChart3,
  Power,
  Trash2,
  Calendar,
  MousePointerClick,
  Link2,
  Plus,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Filter,
} from "lucide-react";
import CopyButton from "@/components/urls/CopyButton";
import LinkStatusBadge from "@/components/urls/LinkStatusBadge";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { formatDate, formatRelativeTime, getShortDomain, getShortUrl } from "@/utils/formatters";

export default function MyLinksView({
  urls = [],
  isLoading = false,
  onToggleStatus,
  onDeleteUrl,
  onOpenAnalytics,
  onOpenCreateModal,
}) {
  const backendBaseUrl =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  // Filter, Search, and Sort States
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "paused"
  const [sortBy, setSortBy] = useState("created_desc"); // "created_desc" | "created_asc" | "clicks_desc" | "clicks_asc"
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Deletion Modal State
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter and Sort Links
  const filteredAndSortedUrls = useMemo(() => {
    let result = [...urls];

    // 1. Search Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.short_code.toLowerCase().includes(q) ||
          (u.title && u.title.toLowerCase().includes(q)) ||
          u.original_url.toLowerCase().includes(q)
      );
    }

    // 2. Status Filter
    if (statusFilter === "active") {
      result = result.filter((u) => u.is_active && !u.is_expired);
    } else if (statusFilter === "paused") {
      result = result.filter((u) => !u.is_active);
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (sortBy === "created_desc") {
        return new Date(b.created_at) - new Date(a.created_at);
      }
      if (sortBy === "created_asc") {
        return new Date(a.created_at) - new Date(b.created_at);
      }
      if (sortBy === "clicks_desc") {
        return (b.clicks ?? b.click_count ?? 0) - (a.clicks ?? a.click_count ?? 0);
      }
      if (sortBy === "clicks_asc") {
        return (a.clicks ?? a.click_count ?? 0) - (b.clicks ?? b.click_count ?? 0);
      }
      return 0;
    });

    return result;
  }, [urls, searchTerm, statusFilter, sortBy]);

  // Pagination calculations
  const totalItems = filteredAndSortedUrls.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedUrls = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredAndSortedUrls.slice(start, start + pageSize);
  }, [filteredAndSortedUrls, validCurrentPage, pageSize]);

  // Reset page when filters change
  const handleFilterChange = (newFilter) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  const handleSearchChange = (val) => {
    setSearchTerm(val);
    setCurrentPage(1);
  };

  const handleSortChange = (val) => {
    setSortBy(val);
    setCurrentPage(1);
  };

  // Confirm delete handler
  const handleConfirmDelete = async (urlId) => {
    setIsDeleting(true);
    try {
      if (onDeleteUrl) await onDeleteUrl(urlId);
      setLinkToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* 1. Header Toolbar with Search, Status Filter, and Sort Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-card border border-surface-border shadow-card flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by vanity code, title, or destination..."
            className="w-full bg-surface-canvas border border-surface-border rounded-xl pl-9 pr-8 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/70 focus:ring-1 focus:ring-brand-500/30 transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs p-0.5"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active / Paused Status Pills */}
          <div className="inline-flex p-1 rounded-xl bg-surface-canvas border border-surface-border text-xs">
            {[
              { id: "all", label: "All Links" },
              { id: "active", label: "Active" },
              { id: "paused", label: "Paused" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleFilterChange(tab.id)}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  statusFilter === tab.id
                    ? "bg-brand-600 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sort Selector Dropdown */}
          <div className="relative flex items-center">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none bg-surface-canvas border border-surface-border rounded-xl pl-8 pr-8 py-2 text-xs text-slate-200 font-medium focus:outline-none focus:border-brand-500/70 focus:ring-1 focus:ring-brand-500/30 cursor-pointer"
            >
              <option value="created_desc">Created: Newest First</option>
              <option value="created_asc">Created: Oldest First</option>
              <option value="clicks_desc">Clicks: Most First</option>
              <option value="clicks_asc">Clicks: Least First</option>
            </select>
            <span className="absolute right-3 pointer-events-none text-slate-500 text-[10px]">
              ▼
            </span>
          </div>

          {/* Links Counter Badge */}
          <span className="text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-surface-canvas border border-surface-border font-mono">
            {totalItems} {totalItems === 1 ? "link" : "links"}
          </span>
        </div>
      </div>

      {/* 2. Loading Skeleton State */}
      {isLoading ? (
        <div className="p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-16 bg-surface-elevated/50 rounded-xl flex items-center justify-between px-4 animate-pulse"
            >
              <div className="space-y-2">
                <div className="h-4 w-40 bg-slate-700/50 rounded"></div>
                <div className="h-3 w-64 bg-slate-800/60 rounded"></div>
              </div>
              <div className="h-7 w-24 bg-slate-800/60 rounded"></div>
            </div>
          ))}
        </div>
      ) : filteredAndSortedUrls.length === 0 ? (
        /* 3. Empty State */
        <div className="p-12 sm:p-16 rounded-2xl bg-surface-card border border-dashed border-surface-border text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-surface-canvas border border-surface-border flex items-center justify-center mx-auto text-slate-500">
            <Link2 className="w-6 h-6 text-slate-400" />
          </div>
          <div className="max-w-sm mx-auto space-y-1">
            <h3 className="text-base font-semibold text-white">
              {searchTerm || statusFilter !== "all"
                ? "No matching short links"
                : "No links created yet"}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {searchTerm || statusFilter !== "all"
                ? "We couldn't find any links matching your current filters. Try resetting search or filter criteria."
                : "Shorten your first target destination URL to begin measuring click analytics and geographic telemetry."}
            </p>
          </div>

          {searchTerm || statusFilter !== "all" ? (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-elevated hover:bg-surface-canvas text-slate-200 text-xs font-medium border border-surface-border transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Filters
            </button>
          ) : (
            onOpenCreateModal && (
              <button
                onClick={onOpenCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-medium shadow-card shadow-brand-500/20 transition-all active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Your First Link
              </button>
            )
          )}
        </div>
      ) : (
        <>
          {/* 4. Desktop Table View (Spacious & Polished) */}
          <div className="hidden md:block rounded-2xl bg-surface-card border border-surface-border shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-surface-border bg-surface-canvas/50 text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
                    <th className="py-3.5 px-5 font-medium">Short URL</th>
                    <th className="py-3.5 px-4 font-medium">Destination URL</th>
                    <th className="py-3.5 px-4 font-medium text-right">Clicks</th>
                    <th className="py-3.5 px-4 font-medium">Created</th>
                    <th className="py-3.5 px-4 font-medium text-center">Status</th>
                    <th className="py-3.5 px-5 font-medium text-right w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/60">
                  {paginatedUrls.map((url) => {
                    const shortDomain = getShortDomain();
                    const fullShortUrl = getShortUrl(url.short_code);

                    return (
                      <tr
                        key={url.id}
                        className="hover:bg-surface-elevated/40 transition-all duration-150 group"
                      >
                        {/* 1. Short URL & Title */}
                        <td className="py-4 px-5 align-middle">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <a
                                href={fullShortUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono font-medium text-brand-300 hover:text-brand-200 transition-colors text-xs bg-brand-500/10 hover:bg-brand-500/20 px-2 py-0.5 rounded border border-brand-500/20 flex items-center gap-1.5"
                                title="Open short URL in new tab"
                              >
                                <span>{shortDomain}/{url.short_code}</span>
                                <ExternalLink className="w-3 h-3 opacity-70" />
                              </a>
                            </div>
                            {url.title ? (
                              <span className="text-[11px] text-slate-300 truncate max-w-[200px] mt-1.5 font-medium">
                                {url.title}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic mt-1.5">
                                Untitled Link
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 2. Original URL */}
                        <td className="py-4 px-4 align-middle">
                          <a
                            href={url.original_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 truncate max-w-[260px]"
                            title={url.original_url}
                          >
                            <span className="truncate font-mono text-[11px]">
                              {url.original_url}
                            </span>
                            <ExternalLink className="w-3 h-3 text-slate-500 shrink-0 opacity-60 group-hover:opacity-100" />
                          </a>
                        </td>

                        {/* 3. Clicks */}
                        <td className="py-4 px-4 align-middle text-right">
                          <div className="inline-flex items-center gap-1 font-mono font-bold text-white text-sm">
                            <MousePointerClick className="w-3.5 h-3.5 text-brand-400" />
                            <span>
                              {(url.clicks ?? url.click_count ?? 0).toLocaleString()}
                            </span>
                          </div>
                        </td>

                        {/* 4. Created */}
                        <td className="py-4 px-4 align-middle">
                          <div className="flex flex-col">
                            <span className="text-slate-300 text-xs font-mono">
                              {formatDate(url.created_at)}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {formatRelativeTime(url.created_at)}
                            </span>
                          </div>
                        </td>

                        {/* 5. Status Badge */}
                        <td className="py-4 px-4 align-middle text-center">
                          <LinkStatusBadge
                            isActive={url.is_active}
                            isExpired={url.is_expired}
                          />
                        </td>

                        {/* 6. Actions */}
                        <td className="py-4 px-5 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy Short URL */}
                            <CopyButton textToCopy={fullShortUrl} size="sm" />

                            {/* Open Analytics */}
                            {onOpenAnalytics && (
                              <button
                                onClick={() => onOpenAnalytics(url)}
                                title="Open Link Analytics"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-brand-300 hover:bg-surface-canvas border border-transparent hover:border-surface-border transition-colors"
                              >
                                <BarChart3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* Disable / Enable Toggle */}
                            <button
                              onClick={() =>
                                onToggleStatus &&
                                onToggleStatus(url.id, !url.is_active)
                              }
                              title={
                                url.is_active
                                  ? "Pause link (disable redirects)"
                                  : "Activate link"
                              }
                              className={`p-1.5 rounded-lg border transition-colors ${
                                url.is_active
                                  ? "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 border-transparent hover:border-amber-500/30"
                                  : "text-amber-400 bg-amber-500/10 border-amber-500/30 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/30"
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Link */}
                            <button
                              onClick={() => setLinkToDelete(url)}
                              title="Delete Link"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Mobile Responsive Card Layout (< 768px) */}
          <div className="block md:hidden space-y-3">
            {paginatedUrls.map((url) => {
              const shortDomain = getShortDomain();
              const fullShortUrl = getShortUrl(url.short_code);

              return (
                <div
                  key={url.id}
                  className="p-4 rounded-xl bg-surface-card border border-surface-border shadow-card space-y-3"
                >
                  {/* Top Bar: Vanity Slug + Status */}
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={fullShortUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-medium text-brand-300 hover:text-brand-200 text-xs bg-brand-500/10 hover:bg-brand-500/20 px-2 py-0.5 rounded border border-brand-500/20 truncate flex items-center gap-1"
                      title="Open short URL"
                    >
                      <span>{shortDomain}/{url.short_code}</span>
                      <ExternalLink className="w-3 h-3 opacity-70 shrink-0" />
                    </a>
                    <LinkStatusBadge
                      isActive={url.is_active}
                      isExpired={url.is_expired}
                    />
                  </div>

                  {/* Title & Original Destination */}
                  <div className="space-y-1">
                    {url.title && (
                      <p className="text-xs font-semibold text-white truncate">
                        {url.title}
                      </p>
                    )}
                    <a
                      href={url.original_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-mono truncate"
                    >
                      <span className="truncate">{url.original_url}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500 shrink-0" />
                    </a>
                  </div>

                  {/* Meta: Clicks & Created Date */}
                  <div className="flex items-center justify-between text-xs py-2 border-t border-surface-border text-slate-400">
                    <div className="flex items-center gap-1.5 font-mono text-white font-semibold">
                      <MousePointerClick className="w-3.5 h-3.5 text-brand-400" />
                      <span>
                        {(url.clicks ?? url.click_count ?? 0).toLocaleString()} clicks
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      {formatDate(url.created_at)}
                    </span>
                  </div>

                  {/* Action Buttons Strip */}
                  <div className="flex items-center justify-between pt-1 gap-2">
                    <CopyButton textToCopy={fullShortUrl} size="sm" />

                    <div className="flex items-center gap-2">
                      {onOpenAnalytics && (
                        <button
                          onClick={() => onOpenAnalytics(url)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-surface-canvas border border-surface-border flex items-center gap-1"
                        >
                          <BarChart3 className="w-3.5 h-3.5 text-brand-400" />
                          <span>Analytics</span>
                        </button>
                      )}

                      <button
                        onClick={() =>
                          onToggleStatus && onToggleStatus(url.id, !url.is_active)
                        }
                        className={`p-1.5 rounded-lg border text-xs ${
                          url.is_active
                            ? "bg-surface-canvas text-slate-400 hover:text-amber-400 border-surface-border"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                        }`}
                        title={url.is_active ? "Pause link" : "Activate link"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setLinkToDelete(url)}
                        className="p-1.5 rounded-lg bg-surface-canvas text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 border border-surface-border"
                        title="Delete link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 6. Pagination Bar */}
          {totalPages > 1 && (
            <div className="p-4 rounded-xl bg-surface-card border border-surface-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-card">
              <span className="text-slate-400">
                Showing{" "}
                <strong className="text-white font-mono">
                  {(validCurrentPage - 1) * pageSize + 1}
                </strong>{" "}
                to{" "}
                <strong className="text-white font-mono">
                  {Math.min(validCurrentPage * pageSize, totalItems)}
                </strong>{" "}
                of <strong className="text-white font-mono">{totalItems}</strong>{" "}
                links
              </span>

              {/* Page Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={validCurrentPage === 1}
                  className="p-1.5 rounded-lg border border-surface-border bg-surface-canvas text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-medium transition-all ${
                      validCurrentPage === pageNum
                        ? "bg-brand-600 text-white font-bold shadow-sm"
                        : "bg-surface-canvas border border-surface-border text-slate-400 hover:text-white"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={validCurrentPage === totalPages}
                  className="p-1.5 rounded-lg border border-surface-border bg-surface-canvas text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  title="Next Page"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* 7. Delete Confirmation Dialog Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(linkToDelete)}
        link={linkToDelete}
        onClose={() => setLinkToDelete(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  );
}
