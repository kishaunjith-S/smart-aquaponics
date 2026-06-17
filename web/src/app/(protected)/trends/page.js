'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTrends } from '@/lib/api';
import { TrendingUp, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import TrendChart from '@/components/TrendChart';

const RANGE_OPTIONS = [
  { value: '1h',  label: 'Last hour'    },
  { value: '24h', label: 'Last 24 hours' },
  { value: '7d',  label: 'Last 7 days'  },
  { value: '30d', label: 'Last 30 days' },
];

const PARAMETERS = [
  { key: 'ph',     title: 'pH',                       unit: '',       color: '#3b82f6', idealMin: 6.5, idealMax: 7.5  },
  { key: 'wt',     title: 'Water Temperature',        unit: '°C',     color: '#f97316', idealMin: 22,  idealMax: 28   },
  { key: 'ec',     title: 'Electrical Conductivity',  unit: 'µS/cm',  color: '#a855f7', idealMin: 800, idealMax: 1500 },
  { key: 'ntu',    title: 'Turbidity',                unit: 'NTU',    color: '#92400e', idealMin: 0,   idealMax: 5    },
  { key: 'do_val', title: 'Dissolved Oxygen',         unit: 'mg/L',   color: '#06b6d4', idealMin: 5,   idealMax: 10   },
];

export default function TrendsPage() {
  const [range, setRange] = useState('24h');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const res = await getTrends(range);
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.detail || err.message || 'Failed to fetch trends');
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setLoading(true);
    fetchData();
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-sm shadow-cyan-500/20">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] leading-tight">
                Water Quality Trends
              </h1>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                {data
                  ? `${data.count} reading${data.count !== 1 ? 's' : ''} in selected range`
                  : 'Loading…'}
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2 text-sm font-medium text-[hsl(var(--foreground))] hover:border-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-400 disabled:opacity-50 transition-all self-start sm:self-auto"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>

        {/* Range filter */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-xs font-medium text-[hsl(var(--muted-foreground))] mr-2">Range:</span>
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              disabled={loading}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:opacity-50 ${
                range === opt.value
                  ? 'bg-cyan-500 text-white shadow-sm'
                  : 'border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] hover:border-cyan-400'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-4 py-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Failed to load trends</p>
              <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Initial loading */}
        {loading && !data && (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 dark:bg-cyan-950/30">
              <Loader2 className="h-7 w-7 animate-spin text-cyan-500" />
            </div>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">Loading trends…</p>
          </div>
        )}

        {/* Empty state */}
        {data && data.count === 0 && !loading && (
          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-12 text-center">
            <p className="text-sm font-medium text-[hsl(var(--foreground))]">
              No readings in this range
            </p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
              Try a longer time range.
            </p>
          </div>
        )}

        {/* Charts grid */}
        {data && data.count > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {PARAMETERS.map((param) => (
              <TrendChart
                key={param.key}
                title={param.title}
                dataKey={param.key}
                unit={param.unit}
                color={param.color}
                idealMin={param.idealMin}
                idealMax={param.idealMax}
                data={data.points}
                range={range}
              />
            ))}
          </div>
        )}

      </div>
    </div>
  );
}