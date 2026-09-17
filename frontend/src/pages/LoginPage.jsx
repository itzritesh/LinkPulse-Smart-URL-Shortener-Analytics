import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/common/Button";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // If already logged in, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!email.trim() || !password.trim()) {
      setFormError("Please provide both email and password.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await login(email.trim(), password);
      toast.success(`Welcome back, ${user.name}!`);
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    } catch (err) {
      setFormError(err.message || "Failed to sign in. Please verify your credentials.");
      toast.error(err.message || "Authentication failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your LinkPulse account to access your links and analytics."
      switchText="Don't have an account yet?"
      switchActionText="Create an account free"
      switchActionTo="/register"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert Banner */}
        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{formError}</div>
          </div>
        )}

        {/* Email Input */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-medium text-slate-300">Email address</label>
          <div className="relative flex items-center">
            <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formError) setFormError("");
              }}
              required
              placeholder="you@company.com"
              className="w-full bg-surface-canvas border border-surface-border rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
        </div>

        {/* Password Input with Visibility Toggle */}
        <div className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">Password</label>
            <span
              onClick={() => toast.info("Password reset flow will be enabled in Phase 5.")}
              className="text-[11px] text-brand-400 hover:text-brand-300 cursor-pointer transition-colors"
            >
              Forgot password?
            </span>
          </div>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formError) setFormError("");
              }}
              required
              placeholder="••••••••••••"
              className="w-full bg-surface-canvas border border-surface-border rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 p-1 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
