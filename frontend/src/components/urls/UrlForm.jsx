import React, { useState } from "react";
import {
  Link2,
  SlidersHorizontal,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Check,
  AlertCircle,
  QrCode,
  Globe,
  Tag,
} from "lucide-react";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import CopyButton from "./CopyButton";
import QrCodeModal from "@/components/landing/QrCodeModal";
import { urlService } from "@/services/urlService";
import { useToast } from "@/context/ToastContext";
import { getShortDomain, getShortUrl } from "@/utils/formatters";

export default function UrlForm({ onLinkCreated }) {
  const toast = useToast();

  const [originalUrl, setOriginalUrl] = useState("");
  const [customCode, setCustomCode] = useState("");
  const [title, setTitle] = useState("");
  const [expiryPreset, setExpiryPreset] = useState("never");
  const [customExpiry, setCustomExpiry] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdLink, setCreatedLink] = useState(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  const calculateExpiryDate = () => {
    if (expiryPreset === "never") return null;
    const now = new Date();
    if (expiryPreset === "24h") {
      return new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    }
    if (expiryPreset === "7d") {
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (expiryPreset === "30d") {
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    if (expiryPreset === "custom" && customExpiry) {
      return new Date(customExpiry).toISOString();
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const trimmedUrl = originalUrl.trim();
    if (!trimmedUrl) {
      setError("Please paste a destination URL.");
      return;
    }

    const lowerUrl = trimmedUrl.toLowerCase();
    if (
      lowerUrl.startsWith("javascript:") ||
      lowerUrl.startsWith("data:") ||
      lowerUrl.startsWith("file:") ||
      lowerUrl.startsWith("vbscript:")
    ) {
      setError("Unsafe URL protocol. Only HTTP and HTTPS destinations are permitted.");
      return;
    }

    if (
      lowerUrl.includes("localhost") ||
      lowerUrl.includes("127.0.0.1") ||
      lowerUrl.includes("169.254.169.254") ||
      lowerUrl.includes("0.0.0.0")
    ) {
      setError("Destination URL targets a private or internal address and cannot be shortened.");
      return;
    }

    setIsLoading(true);
    try {
      const expires_at = calculateExpiryDate();
      const newUrl = await urlService.createUrl({
        original_url: originalUrl.trim(),
        custom_code: customCode.trim() || null,
        title: title.trim() || null,
        expires_at: expires_at,
      });

      setCreatedLink(newUrl);
      toast.success("Short URL generated successfully!");
      if (onLinkCreated) {
        onLinkCreated(newUrl);
      }
    } catch (err) {
      const errMsg = err.message || "Failed to shorten URL.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setOriginalUrl("");
    setCustomCode("");
    setTitle("");
    setExpiryPreset("never");
    setCustomExpiry("");
    setCreatedLink(null);
    setError("");
  };

  return (
    <div className="saas-card p-6 sm:p-7 border border-surface-border hover:border-surface-border/80 transition-all space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">Create Short Link</h2>
            <p className="text-xs text-slate-400">
              Transform long links into vanity URLs with real-time telemetry
            </p>
          </div>
        </div>
        {createdLink && (
          <Button variant="ghost" size="sm" onClick={handleResetForm}>
            Create Another
          </Button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-relaxed">{error}</div>
        </div>
      )}

      {/* URL Creation Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sleek Command-Bar Style Input */}
        <div className="relative rounded-xl p-1.5 bg-surface-canvas border border-surface-border focus-within:border-brand-500/70 focus-within:ring-2 focus-within:ring-brand-500/20 transition-all shadow-inner">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5">
            <div className="relative flex-1 flex items-center pl-3.5">
              <Link2 className="w-4 h-4 text-slate-500 shrink-0 mr-2.5" />
              <input
                type="text"
                value={originalUrl}
                onChange={(e) => {
                  setOriginalUrl(e.target.value);
                  if (error) setError("");
                }}
                required
                placeholder="Paste long destination URL (e.g. https://yourcompany.com/announcement)"
                className="w-full bg-transparent border-none text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-0 py-2"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isLoading}
              className="shrink-0"
            >
              <span>Shorten URL</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Custom Settings Trigger */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors focus:outline-none"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-brand-400" />
            <span>{showSettings ? "Hide advanced options" : "Custom alias, title & expiration"}</span>
          </button>

          {/* Live slug preview */}
          {customCode && (
            <span className="text-xs font-mono text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20 truncate max-w-xs">
              {getShortDomain()}/{customCode}
            </span>
          )}
        </div>

        {/* Collapsible Custom Settings */}
        {showSettings && (
          <div className="p-4 sm:p-5 rounded-xl bg-surface-elevated/60 border border-surface-border space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Custom Alias */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-brand-400" />
                  <span>Custom Vanity Alias</span>
                </label>
                <div className="flex items-center rounded-lg bg-surface-canvas border border-surface-border px-3 py-2 text-xs focus-within:border-brand-500/60">
                  <span className="text-slate-500 font-mono">{getShortDomain()}/</span>
                  <input
                    type="text"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.replace(/\s+/g, "-"))}
                    placeholder="custom-slug"
                    className="w-full bg-transparent border-none text-brand-300 font-mono text-xs focus:outline-none pl-1"
                  />
                </div>
              </div>

              {/* Title / Description */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-brand-400" />
                  <span>Reference Title</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Launch Campaign"
                  className="w-full bg-surface-canvas border border-surface-border rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/60"
                />
              </div>
            </div>

            {/* Expiration Settings */}
            <div className="space-y-2 text-left pt-3 border-t border-surface-border">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Link Expiration</span>
              </label>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: "never", label: "Never" },
                  { id: "24h", label: "24 Hours" },
                  { id: "7d", label: "7 Days" },
                  { id: "30d", label: "30 Days" },
                  { id: "custom", label: "Custom Date" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setExpiryPreset(item.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                      expiryPreset === item.id
                        ? "bg-brand-500 text-white shadow-sm"
                        : "bg-surface-canvas text-slate-400 hover:text-slate-200 border border-surface-border hover:border-slate-700"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                {expiryPreset === "custom" && (
                  <input
                    type="datetime-local"
                    value={customExpiry}
                    onChange={(e) => setCustomExpiry(e.target.value)}
                    className="bg-surface-canvas border border-surface-border rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-brand-500/60"
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Success Animation & Generated Short Link Result Card */}
      {createdLink && (() => {
        const actualShortUrl = getShortUrl(createdLink.short_code) || createdLink.short_url;
        return (
          <div className="p-4 sm:p-5 rounded-xl bg-surface-canvas border border-emerald-500/30 shadow-card animate-fade-in space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 text-left min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="emerald" dot pulse size="sm">
                    Active Short Link
                  </Badge>
                  <span className="text-[11px] text-slate-400 font-mono">
                    ⚡ Redis cached lookup
                  </span>
                </div>
                <a
                  href={actualShortUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-base sm:text-lg font-semibold font-mono text-brand-300 hover:text-brand-200 flex items-center gap-1.5 truncate transition-colors"
                >
                  {actualShortUrl}
                  <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                </a>
                <p className="text-xs text-slate-400 truncate max-w-md">
                  Destination: <span className="text-slate-300">{createdLink.original_url}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <CopyButton
                  text={actualShortUrl}
                  label="Copy Link"
                  variant="primary"
                  size="md"
                />
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setQrModalOpen(true)}
                  title="View QR Code"
                >
                  <QrCode className="w-4 h-4 text-brand-400" />
                </Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* QR Code Modal */}
      {createdLink && (
        <QrCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          shortUrl={getShortUrl(createdLink.short_code) || createdLink.short_url}
        />
      )}
    </div>
  );
}
