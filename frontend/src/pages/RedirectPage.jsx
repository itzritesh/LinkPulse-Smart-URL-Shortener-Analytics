import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { Loader2, ExternalLink } from "lucide-react";

export default function RedirectPage() {
  const { shortCode } = useParams();
  const backendBaseUrl =
    import.meta.env.VITE_BACKEND_URL ||
    (import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, "") : "") ||
    "http://localhost:8000";

  useEffect(() => {
    if (shortCode) {
      // Forward directly to the backend redirect engine
      // This records analytics (IP, country, device, browser) and issues the 307 redirect
      window.location.replace(`${backendBaseUrl}/${shortCode}`);
    }
  }, [shortCode, backendBaseUrl]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080b11] text-slate-100 p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-[#0f1422] border border-[#1c253b] shadow-2xl text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-white tracking-tight">
            Redirecting to destination...
          </h2>
          <p className="text-xs text-slate-400">
            Powered by LinkPulse sub-20ms edge redirection
          </p>
        </div>
        <div className="pt-2">
          <a
            href={`${backendBaseUrl}/${shortCode}`}
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-mono transition-colors"
          >
            <span>Click here if not redirected automatically</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
