import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Production-ready React Error Boundary component.
 * Catches JavaScript errors anywhere in their child component tree,
 * logs errors safely without leaking internal code traces to the user,
 * and renders a polished fallback recovery UI.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In production, send to telemetry/monitoring without exposing raw stack to user
    console.error("[LinkPulse ErrorBoundary caught error]:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080b11] flex items-center justify-center p-6 text-slate-100">
          <div className="max-w-md w-full bg-slate-900/90 border border-slate-800/80 rounded-2xl p-8 shadow-2xl backdrop-blur-xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2 tracking-tight">
              Something went wrong
            </h2>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              An unexpected application error occurred. No data was lost. You can
              refresh the page or return to the home screen.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-violet-600 text-white font-medium text-sm shadow-lg shadow-brand-500/25 hover:from-brand-400 hover:to-violet-500 transition-all active:scale-[0.98]"
              >
                <RefreshCw className="w-4 h-4" />
                Reload Page
              </button>

              <button
                onClick={this.handleGoHome}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 text-slate-300 font-medium text-sm transition-all active:scale-[0.98]"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
