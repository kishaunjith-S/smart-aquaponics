"use client";

import Link from "next/link";
import {
  UploadCloud,
  BarChart2,
  Activity,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Droplets,
  Shield,
  Zap,
  CheckCircle2,
} from "lucide-react";

const STATS = [
  { value: "99.2%", label: "Prediction Accuracy", color: "text-cyan-500" },
  { value: "10s", label: "Real-Time Updates", color: "text-blue-500" },
  { value: "24h", label: "Forecast Horizon", color: "text-indigo-500" },
  { value: "4+", label: "Water Parameters", color: "text-teal-500" },
];

const FEATURES = [
  {
    icon: Activity,
    title: "Real-Time Dashboard",
    desc: "Monitor pH, DO, Nitrate, and Ammonia levels in real-time with automatic updates every 10 seconds and color-coded status indicators.",
    color: "bg-cyan-50 dark:bg-cyan-900/20",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    borderColor: "border-cyan-100 dark:border-cyan-800",
  },
  {
    icon: TrendingUp,
    title: "AI-Powered Predictions",
    desc: "Get accurate 24-hour forecasts based on your latest data or uploaded Excel files. Our models adapt to your specific water system.",
    color: "bg-blue-50 dark:bg-blue-900/20",
    iconColor: "text-blue-600 dark:text-blue-400",
    borderColor: "border-blue-100 dark:border-blue-800",
  },
  {
    icon: AlertCircle,
    title: "Smart Recommendations",
    desc: "Receive actionable recommendations when parameters exceed healthy thresholds with guidance on maintaining optimal water conditions.",
    color: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-100 dark:border-amber-800",
  },
  {
    icon: MessageSquare,
    title: "AI Chatbot Assistant",
    desc: "Ask questions about your water quality data and get instant AI answers with insights and explanations about your system's performance.",
    color: "bg-violet-50 dark:bg-violet-900/20",
    iconColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-100 dark:border-violet-800",
  },
  {
    icon: BarChart2,
    title: "Detailed Analytics",
    desc: "View comprehensive data tables with timestamps, track trends over time, and analyze historical patterns in water quality metrics.",
    color: "bg-indigo-50 dark:bg-indigo-900/20",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-100 dark:border-indigo-800",
  },
  {
    icon: UploadCloud,
    title: "Easy Data Upload",
    desc: "Upload Excel files with historical data to generate custom predictions. Support for multiple time ranges and flexible forecasting options.",
    color: "bg-teal-50 dark:bg-teal-900/20",
    iconColor: "text-teal-600 dark:text-teal-400",
    borderColor: "border-teal-100 dark:border-teal-800",
  },
];

const STEPS = [
  {
    num: "01",
    title: "Create Account",
    desc: "Register for free in seconds. No credit card required.",
    icon: Shield,
  },
  {
    num: "02",
    title: "Connect & Monitor",
    desc: "View live water quality metrics on your dashboard.",
    icon: Activity,
  },
  {
    num: "03",
    title: "Upload Your Data",
    desc: "Import your historical Excel data for richer analysis.",
    icon: UploadCloud,
  },
  {
    num: "04",
    title: "Get AI Forecasts",
    desc: "Receive 24-hour predictions and smart action plans.",
    icon: TrendingUp,
  },
];

const BENEFITS = [
  "No hardware setup required",
  "Works with your existing sensor data",
  "Instant alerts for anomalies",
  "Export reports anytime",
  "Secure cloud storage",
  "Free to get started",
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-cyan-900 text-white">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 py-28 lg:py-36 flex flex-col items-center text-center">
          {/* badge */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-sm font-medium text-cyan-300">
            <Zap className="h-3.5 w-3.5" />
            AI-Powered · Real-Time · Actionable
          </span>

          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight leading-tight lg:text-6xl xl:text-7xl">
            Smart Water Quality
            <span className="block mt-1 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Forecasting Platform
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed">
            Monitor critical water parameters in real-time, receive AI-driven
            24-hour forecasts, and act on intelligent recommendations — all from
            one unified dashboard.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-cyan-500/30 transition-all duration-200 hover:shadow-cyan-400/40 hover:-translate-y-0.5"
            >
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 px-8 py-3.5 text-base font-semibold text-white backdrop-blur transition-all duration-200 hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* wave divider */}
        <div className="relative h-16 overflow-hidden">
          <svg
            className="absolute bottom-0 w-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 64"
            preserveAspectRatio="none"
          >
            <path
              d="M0,32 C360,64 1080,0 1440,32 L1440,64 L0,64 Z"
              className="fill-[hsl(var(--background))]"
            />
          </svg>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 -mt-2 pb-16">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map(({ value, label, color }) => (
            <div
              key={label}
              className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 text-center shadow-sm hover:shadow-md transition-shadow"
            >
              <div className={`text-4xl font-extrabold ${color}`}>{value}</div>
              <div className="mt-1 text-sm text-[hsl(var(--muted-foreground))] font-medium">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-16">
        <div className="text-center mb-14">
          <span className="text-sm font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
            Platform Features
          </span>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Everything You Need
          </h2>
          <p className="mt-3 text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
            A complete toolkit to monitor, predict, and optimize water quality
            for any aquatic environment.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc, color, iconColor, borderColor }) => (
            <div
              key={title}
              className={`group rounded-xl border ${borderColor} ${color} p-6 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
            >
              <div
                className={`inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white/60 dark:bg-white/5 shadow-sm ${iconColor} mb-5`}
              >
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-2">
                {title}
              </h3>
              <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-slate-50 to-cyan-50 dark:from-slate-900/50 dark:to-cyan-950/30 py-20">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              How It Works
            </span>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-[hsl(var(--foreground))]">
              Up and Running in Minutes
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* connector line (desktop) */}
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-cyan-200 via-blue-300 to-indigo-200 dark:from-cyan-800 dark:via-blue-700 dark:to-indigo-800" />

            {STEPS.map(({ num, title, desc, icon: Icon }, i) => (
              <div key={num} className="relative flex flex-col items-center text-center">
                {/* circle */}
                <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white dark:bg-slate-800 border-2 border-cyan-200 dark:border-cyan-700 shadow-md mb-5">
                  <Icon className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
                  <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white shadow">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">
                  {title}
                </h3>
                <p className="text-sm text-[hsl(var(--muted-foreground))] leading-relaxed max-w-[180px]">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Benefits / Why Us ──────────────────────────────────── */}
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* left */}
          <div className="flex-1">
            <span className="text-sm font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
              Why Choose Us
            </span>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] leading-tight">
              Built for Water Quality
              <br />
              <span className="text-cyan-600 dark:text-cyan-400">Professionals</span>
            </h2>
            <p className="mt-4 text-[hsl(var(--muted-foreground))] leading-relaxed max-w-lg">
              Whether you manage aquaculture ponds, municipal water systems, or
              research environments, our platform gives you the intelligence to
              act before problems arise.
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BENEFITS.map((b) => (
                <div key={b} className="flex items-center gap-2.5 text-sm font-medium text-[hsl(var(--foreground))]">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-cyan-500" />
                  {b}
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                Start Monitoring Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* right — visual card stack */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-sm">
              {/* background card */}
              <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 opacity-20 blur-sm" />
              <div className="relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-cyan-500" />
                    <span className="font-semibold text-[hsl(var(--foreground))]">Live Metrics</span>
                  </div>
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow shadow-emerald-400/50 animate-pulse" />
                </div>
                {[
                  { label: "pH Level", value: "7.4", status: "Normal", bar: "w-3/4", col: "bg-emerald-400" },
                  { label: "Dissolved Oxygen", value: "8.2 mg/L", status: "Good", bar: "w-4/5", col: "bg-blue-400" },
                  { label: "Nitrate", value: "12 mg/L", status: "Watch", bar: "w-1/2", col: "bg-amber-400" },
                  { label: "Ammonia", value: "0.3 mg/L", status: "Normal", bar: "w-2/3", col: "bg-cyan-400" },
                ].map(({ label, value, status, bar, col }) => (
                  <div key={label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-[hsl(var(--muted-foreground))]">{label}</span>
                      <span className="font-semibold text-[hsl(var(--foreground))]">{value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[hsl(var(--muted))]">
                      <div className={`h-full rounded-full ${bar} ${col}`} />
                    </div>
                    <div className="text-xs text-right text-[hsl(var(--muted-foreground))]">{status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ─────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-cyan-600 to-blue-700 py-20">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 text-center">
          <h2 className="text-4xl font-extrabold text-white tracking-tight">
            Ready to protect your water quality?
          </h2>
          <p className="mt-4 text-cyan-100 text-lg">
            Join now and start monitoring your water system with the power of AI.
            Free to get started — no hardware needed.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-cyan-700 shadow-lg hover:bg-cyan-50 transition-all duration-200 hover:-translate-y-0.5"
            >
              Create Free Account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg border border-white/40 bg-white/10 px-8 py-3.5 text-base font-semibold text-white hover:bg-white/20 transition-all duration-200 backdrop-blur"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
