'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Waves, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

const PERKS = [
  'Real-time water quality monitoring',
  'AI-powered 24-hour forecasts',
  'Smart anomaly alerts',
  'Actionable recommendations',
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
      <div className="w-full max-w-4xl rounded-2xl border border-[hsl(var(--border))] overflow-hidden shadow-2xl shadow-black/10 dark:shadow-black/40 flex">

        {/* ── Left branding panel ─────────────────────────────── */}
        <div className="hidden lg:flex w-5/12 flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-900 p-10 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-500/10 blur-3xl" />

          {/* Logo */}
          {/* <div className="relative flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 shadow-md shadow-cyan-500/30">
              <Waves className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white tracking-tight">
              Aqua<span className="text-cyan-400">Tracker</span>
            </span>
          </div> */}

          {/* Headline + perks */}
          <div className="relative space-y-5">
            <div>
              <h2 className="text-3xl font-extrabold text-white leading-tight">
                Monitor smarter.
              </h2>
              <h2 className="text-3xl font-extrabold text-cyan-400 leading-tight">
                Act faster.
              </h2>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              Sign in to access your live dashboard, AI forecasts, and water quality analytics.
            </p>
            <ul className="space-y-2.5">
              {PERKS.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-slate-200">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-cyan-400" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* Quote */}
          <div className="relative rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
            <p className="text-xs text-slate-300 italic leading-relaxed">
              "Early detection of water quality anomalies can prevent major environmental and health issues."
            </p>
          </div>
        </div>

        {/* ── Right form panel ────────────────────────────────── */}
        <div className="flex flex-1 items-center justify-center bg-[hsl(var(--card))] px-8 py-10">
          <div className="w-full max-w-sm space-y-7">

            {/* Mobile logo */}
            <div className="flex lg:hidden items-center gap-2 mb-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600">
                <Waves className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-[hsl(var(--foreground))]">
                Aqua<span className="text-cyan-600">Tracker</span>
              </span>
            </div>

            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] tracking-tight">Welcome back</h1>
              <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Sign in to your account to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium text-[hsl(var(--foreground))]">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="email" type="email" required autoComplete="email"
                    placeholder="you@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-2.5 pl-10 pr-4 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-[hsl(var(--foreground))]">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[hsl(var(--muted-foreground))]" />
                  <input
                    id="password" type={showPassword ? 'text' : 'password'} required
                    autoComplete="current-password" placeholder="••••••••" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] py-2.5 pl-10 pr-10 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] outline-none transition-all focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20"
                  />
                  <button type="button" tabIndex={-1}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition-colors">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3.5 py-2.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-red-500" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-cyan-600/20 transition-all duration-150">
                {loading
                  ? <><span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />Signing in…</>
                  : <>Sign In <ArrowRight className="h-4 w-4" /></>}
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-[hsl(var(--border))]" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">New to AquaTracker?</span>
              <div className="flex-1 h-px bg-[hsl(var(--border))]" />
            </div>

            <Link href="/register"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-transparent hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 px-4 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] transition-all duration-150">
              Create a free account
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
