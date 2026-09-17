import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { User as UserIcon, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import AuthLayout from "@/components/auth/AuthLayout";
import Button from "@/components/common/Button";

export default function RegisterPage() {
  const { register, isAuthenticated } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState("");

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const isLengthValid = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumberOrSpecial = /[0-9!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);
  const isPasswordComplex = isLengthValid && hasUppercase && hasLowercase && hasNumberOrSpecial;
  const isMatchValid = password && confirmPassword && password === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (name.trim().length < 2) {
      setFormError("Name must contain at least 2 characters.");
      return;
    }

    if (!isLengthValid) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    if (!isPasswordComplex) {
      setFormError("Password must include uppercase, lowercase, and a number or special character.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match. Please re-enter.");
      return;
    }

    setIsLoading(true);
    try {
      const user = await register(name.trim(), email.trim(), password);
      toast.success(`Account created! Welcome to LinkPulse, ${user.name}.`);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setFormError(err.message || "Failed to create account. Please check your information.");
      toast.error(err.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start generating sub-20ms short links with real-time analytics in seconds."
      switchText="Already have an account?"
      switchActionText="Sign in instead"
      switchActionTo="/login"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert Banner */}
        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-start gap-2.5 text-xs text-rose-300 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{formError}</div>
          </div>
        )}

        {/* Full Name Input */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-medium text-slate-300">Full name</label>
          <div className="relative flex items-center">
            <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (formError) setFormError("");
              }}
              required
              placeholder="Alex Rivers"
              className="w-full bg-surface-canvas border border-surface-border rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
        </div>

        {/* Email Input */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-medium text-slate-300">Work email</label>
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
              placeholder="alex@company.com"
              className="w-full bg-surface-canvas border border-surface-border rounded-xl py-2.5 pl-10 pr-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
          </div>
        </div>

        {/* Password Input */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-medium text-slate-300">Password</label>
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
              placeholder="Minimum 8 characters"
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

        {/* Confirm Password Input */}
        <div className="space-y-1.5 text-left">
          <label className="text-xs font-medium text-slate-300">Confirm password</label>
          <div className="relative flex items-center">
            <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 pointer-events-none" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (formError) setFormError("");
              }}
              required
              placeholder="Re-enter password"
              className="w-full bg-surface-canvas border border-surface-border rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-brand-500/70 focus:ring-2 focus:ring-brand-500/20 transition-all"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3.5 p-1 text-slate-500 hover:text-slate-300 transition-colors focus:outline-none"
              aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Validation Criteria Checks */}
        <div className="p-3.5 rounded-xl bg-surface-canvas border border-surface-border space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                isLengthValid ? "text-emerald-400" : "text-slate-600"
              }`}
            />
            <span className={isLengthValid ? "text-emerald-300" : "text-slate-400"}>
              At least 8 characters long
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                hasUppercase && hasLowercase ? "text-emerald-400" : "text-slate-600"
              }`}
            />
            <span className={hasUppercase && hasLowercase ? "text-emerald-300" : "text-slate-400"}>
              Uppercase and lowercase letters
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2
              className={`w-3.5 h-3.5 ${
                hasNumberOrSpecial ? "text-emerald-400" : "text-slate-600"
              }`}
            />
            <span className={hasNumberOrSpecial ? "text-emerald-300" : "text-slate-400"}>
              At least one number or special character
            </span>
          </div>
          {confirmPassword && (
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`w-3.5 h-3.5 ${
                  isMatchValid ? "text-emerald-400" : "text-rose-500"
                }`}
              />
              <span className={isMatchValid ? "text-emerald-300" : "text-rose-400"}>
                Passwords match
              </span>
            </div>
          )}
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
            <span>Create Free Account</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
}
