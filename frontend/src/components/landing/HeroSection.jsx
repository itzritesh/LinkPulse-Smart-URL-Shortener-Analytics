import React, { useState } from "react";
import {
  Link2,
  ArrowRight,
  Copy,
  Check,
  QrCode,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import Button from "@/components/common/Button";
import Badge from "@/components/common/Badge";
import HeroVisualization from "./HeroVisualization";
import QrCodeModal from "./QrCodeModal";

export default function HeroSection({ onOpenPricing }) {
  const [inputUrl, setInputUrl] = useState("");
  const [customAlias, setCustomAlias] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shortenedLink, setShortenedLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [inputError, setInputError] = useState("");

  const handleShorten = (e) => {
    e.preventDefault();
    if (!inputUrl.trim()) {
      setInputError("Please enter a valid destination URL");
      return;
    }

    // Basic format check
    let formatted = inputUrl.trim();
    if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
      formatted = "https://" + formatted;
    }

    setInputError("");
    setIsLoading(true);

    // Simulate instant client response (business logic placeholder)
    setTimeout(() => {
      const alias =
        customAlias.trim() ||
        "launch-" + Math.random().toString(36).substring(2, 6);
      const generated = `https://pulse.to/${alias}`;
      setShortenedLink({
        original: formatted,
        short: generated,
        alias: alias,
        createdAt: "Just now",
        clicks: 0,
      });
      setIsLoading(false);
    }, 450);
  };

  const handleCopy = () => {
    if (!shortenedLink) return;
    navigator.clipboard.writeText(shortenedLink.short);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden bg-radial-hero">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Copy & Input Shortener */}
          <div className="lg:col-span-7 space-y-8 text-left">
            {/* Pill Announcement */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/25 text-brand-300 text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-cyanPulse-400" />
              <span>Next-Gen Analytics Engine 2.0 Released</span>
              <span className="text-slate-500">•</span>
              <span className="text-cyanPulse-300 hover:underline cursor-pointer" onClick={onOpenPricing}>
                Explore Pro →
              </span>
            </div>

            {/* Main Headline */}
            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Shorter links. <br />
                <span className="text-gradient-primary">Smarter insights.</span> <br />
                Instant velocity.
              </h1>
              <p className="text-base sm:text-lg text-slate-400 max-w-xl leading-relaxed">
                Transform clumsy links into lightning-fast, branded URLs. Track every
                referral, country, device, and campaign conversion in real-time with
                sub-20ms edge redirects.
              </p>
            </div>

            {/* Interactive URL Shortener Form */}
            <div className="space-y-3 max-w-xl">
              <form
                onSubmit={handleShorten}
                className="relative rounded-2xl p-2 bg-[#0d121c] border border-slate-700/80 shadow-2xl focus-within:border-brand-500/80 focus-within:ring-2 focus-within:ring-brand-500/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1 flex items-center pl-3">
                    <Link2 className="w-5 h-5 text-slate-500 shrink-0 mr-2.5" />
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => {
                        setInputUrl(e.target.value);
                        if (inputError) setInputError("");
                      }}
                      placeholder="Paste your long destination URL (e.g. github.com/...)"
                      className="w-full bg-transparent border-none text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-0 py-2.5"
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

                {/* Optional Custom Alias Row */}
                {showAdvanced && (
                  <div className="pt-2 mt-2 border-t border-slate-800/80 px-3 pb-1 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-in">
                    <span className="text-xs text-slate-400">Custom Branded Alias:</span>
                    <div className="flex items-center gap-1 text-xs font-mono">
                      <span className="text-slate-500">pulse.to/</span>
                      <input
                        type="text"
                        value={customAlias}
                        onChange={(e) => setCustomAlias(e.target.value)}
                        placeholder="my-campaign"
                        className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyanPulse-300 text-xs focus:outline-none focus:border-brand-400"
                      />
                    </div>
                  </div>
                )}
              </form>

              {/* Form Toggles & Error */}
              <div className="flex items-center justify-between px-2">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors focus:outline-none"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>{showAdvanced ? "Hide custom alias" : "Customize alias & domain"}</span>
                </button>

                {inputError && (
                  <span className="text-xs text-rose-400 font-medium">
                    {inputError}
                  </span>
                )}
              </div>

              {/* Instant Shortened Result Card */}
              {shortenedLink && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0e1626] to-slate-900 border border-brand-500/40 shadow-xl animate-fade-in space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Link Ready
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          ⚡ 16ms redirect configured
                        </span>
                      </div>
                      <a
                        href={shortenedLink.short}
                        target="_blank"
                        rel="noreferrer"
                        className="text-base sm:text-lg font-bold font-mono text-cyanPulse-300 hover:underline flex items-center gap-1.5 truncate"
                      >
                        {shortenedLink.short}
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </a>
                      <p className="text-[11px] text-slate-400 truncate max-w-sm">
                        Destination: {shortenedLink.original}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant={copied ? "secondary" : "primary"}
                        size="sm"
                        onClick={handleCopy}
                        className={copied ? "text-emerald-400 border-emerald-500/30" : ""}
                      >
                        {copied ? (
                          <>
                            <Check className="w-3.5 h-3.5 mr-1" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 mr-1" />
                            Copy Link
                          </>
                        )}
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setQrModalOpen(true)}
                        title="Generate QR code"
                      >
                        <QrCode className="w-4 h-4 text-cyanPulse-400" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Trust Markers Row */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyanPulse-400" />
                <span>Malware & phishing scanned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Sub-20ms global DNS</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-white">No signup required</span> to test
              </div>
            </div>
          </div>

          {/* Right Column: Decorative Analytics Visualization */}
          <div className="lg:col-span-5">
            <HeroVisualization />
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {shortenedLink && (
        <QrCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          shortUrl={shortenedLink.short}
        />
      )}
    </section>
  );
}
