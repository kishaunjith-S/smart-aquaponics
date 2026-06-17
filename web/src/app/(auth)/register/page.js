'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Waves, User, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

function PasswordStrength({ password }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /\d/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const barColor = ['bg-red-400', 'bg-amber-400', 'bg-emerald-400'][score - 1] ?? 'bg-[hsl(var(--border))]';

  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-1.5">
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < score ? barColor : 'bg-[hsl(var(--border))]'}`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {checks.map(({ label, pass }) => (
          <span key={label} className={`text-xs transition-colors ${pass ? 'text-emerald-600 dark:text-emerald-400' : 'text-[hsl(var(--muted-foreground))]'}`}>
            {pass ? '✓' : '·'} {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) { setError("Passwords don't match."); return; }
    setLoading(true);
    try {
      await register(fullName, email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordMatch = confirmPassword && password === confirmPassword;
  const passwordMismatch = confirmPassword && password !== confirmPassword;

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
      <div className="w-full max-w-4xl rounded-2xl border border-[hsl(var(--border))] overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40 flex">

        {/* ── Left branding panel ─────────────────────────────── */}
        <div className="hidden lg:flex w-5/12 flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-teal-900 p-10 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          {/* Logo
          <div className="relative flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400 to-blue-500 shadow-md shadow-teal-500/30">
              <Waves className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Aqua<span className="text-teal-400">Tracker</span>
            </span>
          </div> */}

          {/* Headline + mini cards */}
          <div className="relative space-y-5">
            <div>
              <h2 className="text-3xl font-extrabold text-white leading-tight">Start for free.</h2>
              <h2 className="text-3xl font-extrabold text-teal-400 leading-tight">No setup needed.</h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Gain instant access to AI-powered water quality forecasting for your environment.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: '📊', title: 'Live Dashboard', desc: 'pH, DO, Nitrate, Ammonia' },
                { icon: '🤖', title: 'AI Predictions', desc: '24-hour forecasts' },
                { icon: '💬', title: 'AI Chatbot', desc: 'Ask your data anything' },
                { icon: '⚡', title: 'Instant Alerts', desc: 'Real-time notifications' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="rounded-lg border border-white/10 bg-white/5 p-2.5 backdrop-blur">
                  <div className="text-base mb-0.5">{icon}</div>
                  <div className="text-xs font-semibold text-white">{title}</div>
                  <div className="text-[10px] text-slate-400 leading-tight">{desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust badge */}
          <div className="relative flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <ShieldCheck className="h-5 w-5 shrink-0 text-teal-400" />
            <div>
              <p className="text-xs font-semibold text-white">Secure & Private</p>
              <p className="text-[10px] text-slate-400">Your data is encrypted and never shared.</p>
            </div>
          </div>
        </div>

        {/* ── Right form panel ────────────────────────────────── */}
        <div className="flex flex-1 items-center justify-center bg-[hsl(var(--card))] px-8 py-10">
          <div className="w-full max-w-sm space-y-6">

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600">
                <Waves className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-[hsl(var(--foreground))]">
                Aqua<span className="text-teal-600">Tracker</span>
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Create your account</h1>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Free forever. No credit card required.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label htmlFor="full-name" className="block text-sm font-medium text-[hsl(var(--foreground))]">Full name</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <input id="full-name" type="text" required autoComplete="name" placeholder="John Doe"
                    value={fullName} onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:focus:border-teal-400 dark:focus:ring-teal-400/20"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-[hsl(var(--foreground))]">Email address</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <input id="email" type="email" required autoComplete="email" placeholder="you@example.com"
                    value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:focus:border-teal-400 dark:focus:ring-teal-400/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-[hsl(var(--foreground))]">Password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <input id="password" type={showPassword ? 'text' : 'password'} required
                    autoComplete="new-password" placeholder="Create a strong password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-2.5 pl-10 pr-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 dark:focus:border-teal-400 dark:focus:ring-teal-400/20"
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label htmlFor="confirm-password" className="block text-sm font-medium text-[hsl(var(--foreground))]">Confirm password</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <input id="confirm-password" type={showConfirm ? 'text' : 'password'} required
                    autoComplete="new-password" placeholder="Repeat your password"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full rounded-lg border bg-[hsl(var(--background))] py-2.5 pl-10 pr-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-all focus:ring-2
                      ${passwordMismatch ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                        : passwordMatch ? 'border-emerald-400 focus:border-emerald-400 focus:ring-emerald-400/20'
                        : 'border-[hsl(var(--border))] focus:border-teal-500 focus:ring-teal-500/20 dark:focus:border-teal-400 dark:focus:ring-teal-400/20'}`}
                  />
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordMismatch && <p className="text-xs text-red-500 dark:text-red-400">Passwords do not match.</p>}
                {passwordMatch && <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ Passwords match.</p>}
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-teal-600/20 transition-all duration-150">
                {loading
                  ? <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Creating account…</>
                  : <>Create Account <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[hsl(var(--border))]" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">Already have an account?</span>
              <div className="flex-1 h-px bg-[hsl(var(--border))]" />
            </div>

            <Link href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-transparent hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-all duration-150">
              Sign in instead
            </Link>

            <p className="text-center text-xs text-[hsl(var(--muted-foreground))]">
              By creating an account you agree to our{' '}
              <span className="underline underline-offset-2 cursor-pointer hover:text-teal-600">Terms of Service</span>
              {' '}and{' '}
              <span className="underline underline-offset-2 cursor-pointer hover:text-teal-600">Privacy Policy</span>.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
