import React from "react";
import { X, Download, Copy, Check, QrCode } from "lucide-react";
import Button from "@/components/common/Button";

export default function QrCodeModal({ isOpen, onClose, shortUrl }) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-canvas/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md bg-surface-card border border-surface-border rounded-2xl p-7 shadow-2xl text-center space-y-6 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-surface-canvas transition-colors"
          aria-label="Close QR modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="space-y-1">
          <div className="w-11 h-11 mx-auto rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-2.5">
            <QrCode className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-semibold text-white tracking-tight">Dynamic QR Code</h3>
          <p className="text-xs text-slate-400">
            Scan to test instant redirection or download for print and digital materials.
          </p>
        </div>

        {/* Realistic SVG QR Pattern */}
        <div className="p-5 bg-white rounded-xl inline-block shadow-lg mx-auto">
          <svg
            className="w-44 h-44"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Corner Markers */}
            <rect x="5" y="5" width="26" height="26" rx="4" fill="#0b0f19" />
            <rect x="9" y="9" width="18" height="18" rx="2" fill="#ffffff" />
            <rect x="13" y="13" width="10" height="10" rx="1" fill="#4f46e5" />

            <rect x="69" y="5" width="26" height="26" rx="4" fill="#0b0f19" />
            <rect x="73" y="9" width="18" height="18" rx="2" fill="#ffffff" />
            <rect x="77" y="13" width="10" height="10" rx="1" fill="#4f46e5" />

            <rect x="5" y="69" width="26" height="26" rx="4" fill="#0b0f19" />
            <rect x="9" y="73" width="18" height="18" rx="2" fill="#ffffff" />
            <rect x="13" y="77" width="10" height="10" rx="1" fill="#4f46e5" />

            {/* Simulated Data Blocks */}
            <rect x="36" y="8" width="8" height="6" fill="#0b0f19" />
            <rect x="48" y="12" width="12" height="6" fill="#0b0f19" />
            <rect x="38" y="24" width="22" height="6" fill="#0b0f19" />
            <rect x="8" y="38" width="18" height="6" fill="#0b0f19" />
            <rect x="30" y="38" width="14" height="6" fill="#6366f1" />
            <rect x="50" y="38" width="10" height="6" fill="#0b0f19" />
            <rect x="66" y="38" width="24" height="6" fill="#0b0f19" />
            <rect x="12" y="48" width="8" height="12" fill="#0b0f19" />
            <rect x="28" y="48" width="16" height="6" fill="#0b0f19" />
            <rect x="48" y="48" width="8" height="14" fill="#4f46e5" />
            <rect x="62" y="48" width="14" height="6" fill="#0b0f19" />
            <rect x="80" y="48" width="10" height="10" fill="#0b0f19" />
            <rect x="36" y="66" width="10" height="10" fill="#0b0f19" />
            <rect x="52" y="66" width="14" height="6" fill="#6366f1" />
            <rect x="72" y="66" width="18" height="6" fill="#0b0f19" />
            <rect x="36" y="82" width="22" height="8" fill="#0b0f19" />
            <rect x="64" y="78" width="12" height="12" fill="#4f46e5" />
            <rect x="80" y="82" width="12" height="8" fill="#0b0f19" />
          </svg>
        </div>

        <div className="p-3 rounded-xl bg-surface-canvas border border-surface-border flex items-center justify-between gap-3 text-left">
          <code className="text-xs font-mono text-brand-300 truncate">
            {shortUrl}
          </code>
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-surface-elevated hover:bg-surface-canvas text-slate-300 hover:text-white shrink-0 transition-colors border border-surface-border"
            title="Copy link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          <Button variant="secondary" className="flex-1" size="sm" onClick={onClose}>
            Done
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            size="sm"
            onClick={() => {
              alert("Downloading High-Res SVG Vector QR Code...");
            }}
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download SVG
          </Button>
        </div>
      </div>
    </div>
  );
}
