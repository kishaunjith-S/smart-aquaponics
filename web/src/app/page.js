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
  KeyRound,
  Fish,
} from "lucide-react";

const STATS = [
  { value: "5s",      label: "Sample Rate",        color: "text-teal-500"    },
  { value: "4+1",     label: "Sensors Tracked",    color: "text-emerald-500" },
  { value: "1 min",   label: "Rollup Granularity", color: "text-emerald-500" },
  { value: "24/7",    label: "Continuous",         color: "text-teal-500"    },
];

const FEATURES = [
  {
    icon: Activity,
    title: "Real-Time Aquaponics Dashboard",
    desc: "Live readings of pH, water temperature, electrical conductivity (EC), and turbidity from Arduino + Raspberry Pi sensors. Color-coded WQI scoring with 1-minute rollups.",
    color: "bg-teal-50 dark:bg-teal-900/20",
    iconColor: "text-teal-600 dark:text-teal-400",
    borderColor: "border-teal-100 dark:border-teal-800",
  },
  {
    icon: MessageSquare,
    title: "Gemini-Powered Assistant",
    desc: "Ask questions about your tank's health in plain English. Our AI assistant has live sensor context and provides expert diagnostics with actionable recommendations.",
    color: "bg-emerald-50 dark:bg-emerald-900/20",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-100 dark:border-emerald-800",
  },
  {
    icon: TrendingUp,
    title: "Historical Trends",
    desc: "Multi-parameter line charts with configurable time ranges (1 hour to 30 days). Ideal-range bands show at a glance whether your aquaponics system is in balance.",
    color: "bg-teal-50 dark:bg-teal-900/20",
    iconColor: "text-teal-600 dark:text-teal-400",
    borderColor: "border-teal-100 dark:border-teal-800",
  },
  {
    icon: AlertCircle,
    title: "Water Quality Index",
    desc: "Each parameter scored against aquaponics-specific thresholds and combined into a 0-100 WQI. Instantly know if your fish and plants are thriving or stressed.",
    color: "bg-amber-50 dark:bg-amber-900/20",
    iconColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-100 dark:border-amber-800",
  },
  {
    icon: UploadCloud,
    title: "Secure Device API",
    desc: "Push readings from your Raspberry Pi, Arduino, or any IoT device using personal API keys. Built-in idempotency and 7-day on-device buffer for offline resilience.",
    color: "bg-indigo-50 dark:bg-indigo-900/20",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    borderColor: "border-indigo-100 dark:border-indigo-800",
  },
  {
    icon: Shield,
    title: "Secure & Open",
    desc: "JWT-protected user accounts and SHA-256 hashed API keys at rest. Open-source codebase — deploy on your own AWS or use ours.",
    color: "bg-violet-50 dark:bg-violet-900/20",
    iconColor: "text-violet-600 dark:text-violet-400",
    borderColor: "border-violet-100 dark:border-violet-800",
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
    title: "Generate API Key",
    desc: "Create a per-device API key from your dashboard.",
    icon: KeyRound,
  },
  {
    num: "03",
    title: "Connect Your Sensors",
    desc: "Send pH, temp, EC, and turbidity readings to /v1/ingest.",
    icon: UploadCloud,
  },
  {
    num: "04",
    title: "Monitor & Diagnose",
    desc: "View live data, trends, WQI, and ask our AI assistant.",
    icon: TrendingUp,
  },
];

const BENEFITS = [
  "Built specifically for aquaponics — fish + plants",
  "Works with Raspberry Pi + Arduino sensors",
  "5 parameters: pH, Temp, EC, NTU, DO",
  "AI-powered diagnostics via Gemini",
  "Open-source — deploy on your own AWS",
  "Free to get started",
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-teal-900 text-white">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-40 -right-40 h-[600px] w-[600px] rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-screen-2xl px-4 sm:px-6 py-28 lg:py-36 flex flex-col items-center text-center">
          {/* badge */}
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-4 py-1.5 text-sm font-medium text-teal-300">
            <Zap className="h-3.5 w-3.5" />
            Aquaponics · Real-Time · AI-Assisted
          </span>

          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight leading-tight lg:text-6xl xl:text-7xl">
            Smart Aquaponics
            <span className="block mt-1 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              Monitoring Platform
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-slate-300 leading-relaxed">
            Real-time monitoring for your aquaponics system. Track pH,
            temperature, conductivity, and turbidity with AI-powered insights
            that help your fish and plants thrive — all from one dashboard.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-teal-500 hover:bg-teal-400 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-teal-500/30 transition-all duration-200 hover:shadow-teal-400/40 hover:-translate-y-0.5"
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
          <span className="text-sm font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
            Platform Features
          </span>
          <h2 className="mt-2 text-4xl font-bold tracking-tight text-[hsl(var(--foreground))]">
            Everything You Need
          </h2>
          <p className="mt-3 text-[hsl(var(--muted-foreground))] max-w-xl mx-auto">
            A complete toolkit to monitor, diagnose, and optimize your
            aquaponics system — built from real hardware on day one.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, color, iconColor, borderColor }) => (
            <div
              key={title}
              className={`group rounded-xl border ${borderColor} bg-[hsl(var(--card))] p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}
            >
              <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
                <Icon className={`h-6 w-6 ${iconColor}`} />
              </div>
              <h3 className="text-lg font-semibold text-[hsl(var(--foreground))]">{title}</h3>
              <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────── */}
      <section className="bg-[hsl(var(--muted))]/40 py-20">
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
              How It Works
            </span>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-[hsl(var(--foreground))]">
              From Sensors to Insights
            </h2>
          </div>
          <div className="relative grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* connector line for md+ */}
            <div className="hidden md:block absolute top-12 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-teal-300 via-emerald-300 to-indigo-300" />
            {STEPS.map(({ num, title, desc, icon: Icon }) => (
              <div key={num} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border-2 border-teal-300 bg-[hsl(var(--card))]">
                  <Icon className="h-9 w-9 text-teal-600 dark:text-teal-400" />
                  <span className="absolute -top-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-teal-500 text-xs font-bold text-white">
                    {parseInt(num)}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-[hsl(var(--foreground))]">{title}</h3>
                <p className="mt-2 max-w-[200px] text-sm text-[hsl(var(--muted-foreground))]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ──────────────────────────────────────── */}
      <section className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          {/* left — copy */}
          <div className="flex-1">
            <span className="text-sm font-semibold uppercase tracking-widest text-teal-600 dark:text-teal-400">
              Why Choose Us
            </span>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-[hsl(var(--foreground))] leading-tight">
              Built for Aquaponics
              <br />
              <span className="text-teal-600 dark:text-teal-400">Researchers & Hobbyists</span>
            </h2>
            <p className="mt-4 text-[hsl(var(--muted-foreground))] leading-relaxed max-w-lg">
              Whether you run a research tank, a backyard aquaponics setup, or a
              small commercial operation, our platform gives you visibility into
              fish health, plant nutrition, and water chemistry — all from real
              sensors, no guesswork.
            </p>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {BENEFITS.map((b) => (
                <div key={b} className="flex items-center gap-2.5 text-sm font-medium text-[hsl(var(--foreground))]">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-teal-500" />
                  {b}
                </div>
              ))}
            </div>
            <div className="mt-10">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-600 hover:bg-teal-500 px-7 py-3 text-base font-semibold text-white shadow-lg shadow-teal-600/20 transition-all duration-200 hover:-translate-y-0.5"
              >
                Start Monitoring Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {/* right — visual card stack */}
          <div className="flex-1 flex justify-center">
            <div className="relative w-full max-w-sm">
              <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 opacity-20 blur-sm" />
              <div className="relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-teal-500" />
                    <span className="font-semibold text-[hsl(var(--foreground))]">Live Tank Metrics</span>
                  </div>
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 shadow shadow-emerald-400/50 animate-pulse" />
                </div>
                {[
                  { label: "pH",           value: "6.8",        status: "Healthy",  bar: "w-3/4", col: "bg-emerald-400" },
                  { label: "Water Temp",   value: "27.5 °C",    status: "Warm",     bar: "w-5/6", col: "bg-amber-400"   },
                  { label: "Conductivity", value: "850 µS",     status: "Low",      bar: "w-1/4", col: "bg-amber-400"   },
                  { label: "Turbidity",    value: "12 NTU",     status: "High",     bar: "w-4/5", col: "bg-red-400"     },
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
      <section className="bg-gradient-to-r from-teal-600 to-emerald-700 py-20">
          <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 text-center">
          <h2 className="text-4xl font-extrabold text-white tracking-tight">
            Ready to optimize your aquaponics?
          </h2>
          <p className="mt-4 text-teal-100 text-lg">
            Join now and start monitoring fish and plant health in real-time.
            Free to start — bring your own hardware, or learn how to build one.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-teal-700 shadow-lg hover:bg-teal-50 transition-all duration-200 hover:-translate-y-0.5"
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