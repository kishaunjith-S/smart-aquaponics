'use client';

import { useState, useRef } from 'react';
import { getNext24HourPrediction, getPredictionFromExcel } from '@/lib/api';
import PredictionTable from '@/components/PredictionTable';
import {
  Loader2, Upload, TrendingUp, FileSpreadsheet, Zap,
  AlertCircle, CheckCircle2, X, FileUp,
} from 'lucide-react';

function ErrorBanner({ message }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 px-3.5 py-3 mt-4">
      <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
      <p className="text-sm text-red-700 dark:text-red-400">{message}</p>
    </div>
  );
}

function ResultsSection({ data, title }) {
  return (
    <div className="mt-5">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        <h3 className="text-sm font-semibold text-[hsl(var(--foreground))]">{title}</h3>
        <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">{data.length} rows</span>
      </div>
      <PredictionTable data={data} />
    </div>
  );
}

export default function PredictionPage() {
  const [livePrediction, setLivePrediction] = useState(null);
  const [filePrediction, setFilePrediction] = useState(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [errorLive, setErrorLive] = useState(null);
  const [errorFile, setErrorFile] = useState(null);
  const [file, setFile] = useState(null);
  const [hours, setHours] = useState(24);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleGetLivePrediction = async () => {
    setIsLoadingLive(true);
    setErrorLive(null);
    setLivePrediction(null);
    try {
      const data = await getNext24HourPrediction();
      setLivePrediction(data.predictions);
    } catch (err) {
      setErrorLive(err.response?.data?.detail || 'Failed to fetch live prediction.');
    } finally {
      setIsLoadingLive(false);
    }
  };

  const handleFilePrediction = async () => {
    if (!file) { setErrorFile('Please select a file first.'); return; }
    setIsLoadingFile(true);
    setErrorFile(null);
    setFilePrediction(null);
    try {
      const data = await getPredictionFromExcel(file, hours);
      setFilePrediction(data.predictions);
    } catch (err) {
      setErrorFile(err.response?.data?.detail || 'Failed to get prediction from file.');
    } finally {
      setIsLoadingFile(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped && (dropped.name.endsWith('.xls') || dropped.name.endsWith('.xlsx'))) {
      setFile(dropped);
      setErrorFile(null);
    } else {
      setErrorFile('Please drop a valid Excel file (.xls or .xlsx).');
    }
  };

  return (
    <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 py-8">

      {/* ── Page header ──────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-sm shadow-cyan-500/20">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--foreground))] leading-tight">AI Prediction</h1>
          <p className="text-xs text-[hsl(var(--muted-foreground))]">Generate water quality forecasts using live data or your own Excel files</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* ── Live Forecast Card ───────────────────────── */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="border-b border-[hsl(var(--border))] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-50 dark:bg-cyan-950/40">
                <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">Live 24-Hour Forecast</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Based on the most recent sensor readings</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            {/* Info box */}
            <div className="rounded-lg border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-950/30 px-4 py-3 mb-5">
              <p className="text-xs text-cyan-700 dark:text-cyan-300 leading-relaxed">
                Generates a <strong>24-hour forecast</strong> for pH, Dissolved Oxygen, Nitrate, and Ammonia using the latest real-time data from your sensors.
              </p>
            </div>

            <button
              onClick={handleGetLivePrediction}
              disabled={isLoadingLive}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-cyan-600/20 transition-all duration-150 hover:-translate-y-0.5"
            >
              {isLoadingLive
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
                : <><TrendingUp className="h-4 w-4" /> Generate Live Forecast</>}
            </button>

            {errorLive && <ErrorBanner message={errorLive} />}
            {livePrediction && <ResultsSection data={livePrediction} title="24-Hour Forecast Results" />}
          </div>
        </div>

        {/* ── File Upload Card ─────────────────────────── */}
        <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-sm overflow-hidden">
          {/* Card header */}
          <div className="border-b border-[hsl(var(--border))] px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-50 dark:bg-violet-950/40">
                <FileSpreadsheet className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-[hsl(var(--foreground))]">Predict from Excel File</h2>
                <p className="text-xs text-[hsl(var(--muted-foreground))]">Upload historical data for custom forecasts</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Hours input */}
            <div className="space-y-1.5">
              <label htmlFor="hours" className="block text-sm font-medium text-[hsl(var(--foreground))]">
                Forecast horizon (hours)
              </label>
              <div className="relative w-36">
                <input
                  id="hours"
                  type="number"
                  min={1}
                  max={168}
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value, 10) || 24)}
                  className="w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm text-[hsl(var(--foreground))] outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:focus:border-cyan-400 dark:focus:ring-cyan-400/20 transition-all"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--muted-foreground))]">hrs</span>
              </div>
            </div>

            {/* Drop zone */}
            <div>
              <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-1.5">
                Excel file
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  'relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center cursor-pointer transition-all duration-150',
                  dragOver
                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30'
                    : file
                    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'
                    : 'border-[hsl(var(--border))] hover:border-cyan-400 hover:bg-[hsl(var(--accent))]/30'
                )}
              >
                {file ? (
                  <>
                    <FileSpreadsheet className="h-8 w-8 text-emerald-500 mb-2" />
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{file.name}</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); setFilePrediction(null); setErrorFile(null); }}
                      className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--muted))] hover:bg-[hsl(var(--accent))] text-[hsl(var(--muted-foreground))] transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <>
                    <FileUp className="h-8 w-8 text-[hsl(var(--muted-foreground))] mb-2" />
                    <p className="text-sm font-medium text-[hsl(var(--foreground))]">Drop your Excel file here</p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-0.5">or click to browse · .xls, .xlsx</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xls,.xlsx"
                className="hidden"
                onChange={(e) => {
                  setFile(e.target.files[0] || null);
                  setErrorFile(null);
                  setFilePrediction(null);
                }}
              />
            </div>

            <button
              onClick={handleFilePrediction}
              disabled={isLoadingFile || !file}
              className="inline-flex items-center gap-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-violet-600/20 transition-all duration-150 hover:-translate-y-0.5"
            >
              {isLoadingFile
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</>
                : <><Upload className="h-4 w-4" /> Upload & Predict</>}
            </button>

            {errorFile && <ErrorBanner message={errorFile} />}
            {filePrediction && <ResultsSection data={filePrediction} title="File-Based Forecast Results" />}
          </div>
        </div>

      </div>
    </div>
  );
}

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
