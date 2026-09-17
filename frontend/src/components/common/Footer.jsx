import React from "react";
import { Link2, Github, Twitter, Linkedin, Heart } from "lucide-react";
import StatusIndicator from "@/components/feedback/StatusIndicator";
import { useApp } from "@/context/AppContext";

export default function Footer({ onOpenPricing }) {
  const { health } = useApp();

  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#06080e] pt-16 pb-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800/80">
          {/* Brand Col */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-cyanPulse-500 flex items-center justify-center text-white">
                <Link2 className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-white">
                Link<span className="text-cyanPulse-400">Pulse</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Next-generation URL shortener and real-time click telemetry infrastructure.
              Delivering sub-20ms global edge redirects, UTM campaign attribution, and
              privacy-first analytics.
            </p>
            <div className="flex items-center gap-4 text-slate-400 pt-1">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                aria-label="GitHub repository"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                aria-label="Twitter / X profile"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition-colors"
                aria-label="LinkedIn page"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Product Col */}
          <div className="space-y-3 text-xs">
            <p className="font-bold text-white uppercase tracking-wider">Product</p>
            <ul className="space-y-2">
              <li>
                <a href="#analytics-preview" className="hover:text-white transition-colors">
                  Analytics Suite
                </a>
              </li>
              <li>
                <a href="#features" className="hover:text-white transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <button onClick={onOpenPricing} className="hover:text-white transition-colors">
                  Pricing Plans
                </button>
              </li>
              <li>
                <a href="#security" className="hover:text-white transition-colors">
                  Security Architecture
                </a>
              </li>
            </ul>
          </div>

          {/* Developers Col */}
          <div className="space-y-3 text-xs">
            <p className="font-bold text-white uppercase tracking-wider">Developers</p>
            <ul className="space-y-2">
              <li>
                <a
                  href="http://localhost:8000/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  REST API (Swagger)
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8000/redoc"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  ReDoc Reference
                </a>
              </li>
              <li>
                <a
                  href="http://localhost:8000/api/health"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  API Health Heartbeat
                </a>
              </li>
              <li>
                <span className="text-slate-500">FastAPI + PostgreSQL</span>
              </li>
            </ul>
          </div>

          {/* Trust & Legal */}
          <div className="space-y-3 text-xs">
            <p className="font-bold text-white uppercase tracking-wider">Legal & Trust</p>
            <ul className="space-y-2">
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Privacy Policy</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Terms of Service</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">GDPR Compliance</span>
              </li>
              <li>
                <span className="hover:text-white transition-colors cursor-pointer">Abuse Reporting</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <StatusIndicator
              status={health?.status === "healthy" ? "healthy" : "degraded"}
              label={
                health?.status === "healthy"
                  ? "All Edge Systems Operational"
                  : "Database Standby / Offline"
              }
            />
            <span className="text-slate-600">•</span>
            <span>Uptime: 99.99%</span>
          </div>

          <p className="text-slate-500">
            &copy; {new Date().getFullYear()} LinkPulse SaaS. Built with React + FastAPI + SQLAlchemy.
          </p>
        </div>
      </div>
    </footer>
  );
}
