'use client';

import { useState, useEffect, useCallback } from 'react';
import { getWaterQualityHistory } from '@/lib/api';
import { Activity, RefreshCw, Loader2, AlertCircle, Droplets } from 'lucide-react';

// ─── Score cell colour ────────────────────────────────────────────────────────
function scoreClass(score) {
  if (score === null || score === undefined) return 'text-slate-400';
  if (score >= 100) return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300';
  if (score >= 70)  return 'bg-orange-100  text-orange-800  dark:bg-orange-950/60  dark:text-orange-300';
  return               'bg-red-100     text-red-800     dark:bg-red-950/60     dark:text-red-300';
}

function statusBadge(status) {
  switch (status) {
    case 'Excellent': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    case 'Moderate':  return 'bg-orange-100  text-orange-800  dark:bg-orange-950/60  dark:text-orange-300  border-orange-200  dark:border-orange-800';
    case 'Poor':      return 'bg-red-100     text-red-800     dark:bg-red-950/60     dark:text-red-300     border-red-200     dark:border-red-800';
    default:          return 'bg-rose-100    text-rose-900    dark:bg-rose-950/60    dark:text-rose-300    border-rose-200    dark:border-rose-800';
  }
}

function bannerGradient(status) {
  switch (status) {
    case 'Excellent': return 'from-emerald-600 to-teal-600';
    case 'Moderate':  return 'from-orange-500 to-amber-500';
    case 'Poor':      return 'from-red-500 to-rose-500';
    default:          return 'from-rose-900 to-red-800';
  }
}

function ScoreCell({ value }) {
  if (value === null || value === undefined) return <span className="text-slate-400">—</span>;
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold tabular-nums ${scoreClass(value)}`}>
      {value}
    </span>
  );
}

function formatIST(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function fmt(val, decimals = 2) {
  if (val === null || val === undefined) return '—';
  return Number(val).toFixed(decimals);
}

// ─── Status Banner ────────────────────────────────────────────────────────────
function StatusBanner({ latest }) {
  const { timestamp, raw_values: rv, individual_scores: is_, overall_wqi, status } = latest;

  const scores = [
    { label: 'pH',   value: is_.wqi_pH },
    { label: 'Temp', value: is_.wqi_temp },
    { label: 'DO',   value: is_.wqi_do },
    { label: 'Cond', value: is_.wqi_cond },
    { label: 'Turb', value: is_.wqi_turb },
  ];

  return (
    <div className={`rounded-2xl bg-gradient-to-r ${bannerGradient(status)} p-px shadow-lg mb-8`}>
      <div className="rounded-[calc(1rem-1px)] bg-[hsl(var(--card))] px-6 py-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

          {/* Left — WQI score + status */}
          <div className="flex items-center gap-4">
            <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${bannerGradient(status)} shadow-md`}>
              <Droplets className="h-7 w-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-4xl font-extrabold tabular-nums text-[hsl(var(--foreground))]">
                  {overall_wqi}
                </span>
                <span className={`rounded-full border px-3 py-1 text-sm font-bold uppercase tracking-wide ${statusBadge(status)}`}>
                  {status}
                </span>
              </div>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                Overall WQI · Reading at <span className="font-medium">{formatIST(timestamp)}</span>
              </p>
            </div>
          </div>

          {/* Right — raw sensor values */}
          <div className="grid grid-cols-5 gap-3 text-center">
            {[
              { label: 'pH',     value: fmt(rv.pH, 2) },
              { label: 'Temp',   value: `${fmt(rv.temp, 1)}°C` },
              { label: 'DO',     value: `${fmt(rv.DO, 2)} mg/L` },
              { label: 'Cond',   value: `${fmt(rv.conductivity, 0)} µS` },
              { label: 'Turb',   value: `${fmt(rv.turbidity, 2)} NTU` },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col gap-0.5">
                <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">{label}</span>
                <span className="text-sm font-bold text-[hsl(var(--foreground))] tabular-nums">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual WQI score pills */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-[hsl(var(--border))] pt-4">
          {scores.map(({ label, value }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="text-xs text-[hsl(var(--muted-foreground))]">{label}</span>
              <span className={`rounded px-2 py-0.5 text-xs font-bold ${scoreClass(value)}`}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Table headers ────────────────────────────────────────────────────────────
const TH_BASE = 'px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide whitespace-nowrap';

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [history, setHistory]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await getWaterQualityHistory(200);
      setHistory(res);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 30000);
    return () => clearInterval(id);
  }, [fetchData]);

  const handleRefresh = () => { setLoading(true); fetchData(); };

  const latest = history?.records?.[0] ?? null;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-sm shadow-teal-500/20">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] leading-tight">
                Water Quality Dashboard
              </h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5 flex items-center gap-1.5">
                {lastUpdated ? (
                  <>
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live · Refreshed {lastUpdated.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </>
                ) : 'Auto-refreshes every 30 seconds'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:border-teal-400 hover:text-teal-600 dark:hover:text-teal-400 disabled:opacity-50 transition-all self-start sm:self-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* ── Error ───────────────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Failed to load data</p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Initial loading ──────────────────────────────────────────────── */}
        {loading && !history && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-950/30">
              <Loader2 className="h-7 w-7 animate-spin text-teal-500" />
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading water quality report…</p>
          </div>
        )}

        {/* ── Content ─────────────────────────────────────────────────────── */}
        {history && (
          <>
            {/* Status Banner */}
            {latest && <StatusBanner latest={latest} />}

            {/* Report Table */}
            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm overflow-hidden">
              {/* Table header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[hsl(var(--border))]">
                <div>
                  <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">
                    Water Quality Index (WQI) Report
                  </h2>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                    {history.total} record{history.total !== 1 ? 's' : ''} · most recent first
                  </p>
                </div>
                {/* Score legend */}
                <div className="hidden sm:flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded bg-emerald-400" />
                    100 — Excellent
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded bg-orange-400" />
                    70 — Moderate
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block h-3 w-3 rounded bg-red-400" />
                    30 — Critical
                  </span>
                </div>
              </div>

              {/* Scrollable table */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    {/* Group headers */}
                    <tr className="bg-[hsl(var(--muted))]/60 border-b border-[hsl(var(--border))]">
                      <th className={`${TH_BASE} text-[hsl(var(--muted-foreground))]`} rowSpan={2}>
                        Timestamp
                      </th>
                      <th
                        colSpan={5}
                        className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] border-x border-[hsl(var(--border))]"
                      >
                        Raw Sensor Data
                      </th>
                      <th
                        colSpan={5}
                        className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))] border-x border-[hsl(var(--border))]"
                      >
                        WQI Scores (0–100)
                      </th>
                      <th
                        colSpan={2}
                        className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]"
                      >
                        Overall
                      </th>
                    </tr>
                    <tr className="bg-[hsl(var(--muted))]/40 border-b-2 border-[hsl(var(--border))]">
                      {/* Raw sensor columns */}
                      {['pH', 'Temp (°C)', 'Cond. (µS/cm)', 'DO (mg/L)', 'Turbidity (NTU)'].map((h) => (
                        <th key={h} className={`${TH_BASE} text-[hsl(var(--muted-foreground))] border-l border-[hsl(var(--border))]`}>{h}</th>
                      ))}
                      {/* WQI score columns */}
                      {['WQI_pH', 'WQI_Temp', 'WQI_DO', 'WQI_Cond', 'WQI_Turb'].map((h) => (
                        <th key={h} className={`${TH_BASE} text-[hsl(var(--muted-foreground))] border-l border-[hsl(var(--border))]`}>{h}</th>
                      ))}
                      {/* Overall */}
                      <th className={`${TH_BASE} text-[hsl(var(--muted-foreground))] border-l border-[hsl(var(--border))]`}>WQI Overall</th>
                      <th className={`${TH_BASE} text-[hsl(var(--muted-foreground))] border-l border-[hsl(var(--border))]`}>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {history.records.length === 0 && (
                      <tr>
                        <td colSpan={13} className="py-16 text-center text-sm text-[hsl(var(--muted-foreground))]">
                          No records found. Data will appear here once sensor readings are uploaded.
                        </td>
                      </tr>
                    )}
                    {history.records.map((rec, idx) => {
                      const rv = rec.raw_values;
                      const is_ = rec.individual_scores;
                      const isLatest = idx === 0;

                      return (
                        <tr
                          key={rec.timestamp + idx}
                          className={`border-b border-[hsl(var(--border))] transition-colors
                            ${isLatest
                              ? 'bg-teal-50/60 dark:bg-teal-950/20 hover:bg-teal-50 dark:hover:bg-teal-950/30'
                              : 'hover:bg-[hsl(var(--muted))]/30'
                            }`}
                        >
                          {/* Timestamp */}
                          <td className="px-3 py-2.5 whitespace-nowrap font-mono text-xs text-[hsl(var(--foreground))]">
                            {isLatest && (
                              <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse align-middle" />
                            )}
                            {formatIST(rec.timestamp)}
                          </td>

                          {/* Raw sensor data */}
                          <td className="px-3 py-2.5 tabular-nums text-[hsl(var(--foreground))] border-l border-[hsl(var(--border))]">{fmt(rv.pH, 2)}</td>
                          <td className="px-3 py-2.5 tabular-nums text-[hsl(var(--foreground))] border-l border-[hsl(var(--border))]">{fmt(rv.temp, 1)}</td>
                          <td className="px-3 py-2.5 tabular-nums text-[hsl(var(--foreground))] border-l border-[hsl(var(--border))]">{fmt(rv.conductivity, 0)}</td>
                          <td className="px-3 py-2.5 tabular-nums text-[hsl(var(--foreground))] border-l border-[hsl(var(--border))]">{fmt(rv.DO, 2)}</td>
                          <td className="px-3 py-2.5 tabular-nums text-[hsl(var(--foreground))] border-l border-[hsl(var(--border))]">{fmt(rv.turbidity, 2)}</td>

                          {/* WQI individual scores */}
                          <td className="px-3 py-2.5 text-center border-l border-[hsl(var(--border))]"><ScoreCell value={is_.wqi_pH} /></td>
                          <td className="px-3 py-2.5 text-center border-l border-[hsl(var(--border))]"><ScoreCell value={is_.wqi_temp} /></td>
                          <td className="px-3 py-2.5 text-center border-l border-[hsl(var(--border))]"><ScoreCell value={is_.wqi_do} /></td>
                          <td className="px-3 py-2.5 text-center border-l border-[hsl(var(--border))]"><ScoreCell value={is_.wqi_cond} /></td>
                          <td className="px-3 py-2.5 text-center border-l border-[hsl(var(--border))]"><ScoreCell value={is_.wqi_turb} /></td>

                          {/* Overall WQI */}
                          <td className="px-3 py-2.5 text-center border-l border-[hsl(var(--border))]">
                            <span className={`inline-block rounded px-2 py-0.5 text-xs font-bold tabular-nums ${scoreClass(rec.overall_wqi)}`}>
                              {rec.overall_wqi}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2.5 border-l border-[hsl(var(--border))]">
                            <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${statusBadge(rec.status)}`}>
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
