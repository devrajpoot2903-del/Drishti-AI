"use client";

import React from "react";
import { ImpactMetrics } from "@/lib/types";

interface ImpactMeterProps {
  metrics: ImpactMetrics | null;
  loading: boolean;
  error: string | null;
}

export function ImpactMeter({ metrics, loading, error }: ImpactMeterProps) {
  if (error) {
    return (
      <div className="drishti-card p-5 text-xs text-gray-400">
        Processing Impact: Unable to load metrics from server.
      </div>
    );
  }

  const processedCount = metrics ? metrics.applicationsProcessed : 0;
  const avgTime = metrics && processedCount > 0 ? metrics.averageProcessingTimeFormatted : "—";
  const timeSaved = metrics && processedCount > 0 ? metrics.estimatedTimeSavedFormatted : "—";

  return (
    <div className="drishti-card p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">
            Processing Impact & Efficiency Benchmark
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Measured automated runtime duration compared against an administrator-configured scrutiny baseline
          </p>
        </div>
        <div className="text-[11px] text-gray-300 font-medium bg-white/5 px-2.5 py-1 rounded-md border border-white/10">
          Configured Baseline: {metrics?.baselineManualMinutes || 120}m / dossier (Illustrative)
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        {/* Metric 1: Applications Processed */}
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Applications Processed
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-sans tracking-tight">
            {loading ? "—" : processedCount}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Validated by multi-agent scrutiny pipeline
          </p>
        </div>

        {/* Metric 2: Avg. Processing Time */}
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Avg. Processing Time (Measured)
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-sans tracking-tight font-mono">
            {loading ? "—" : avgTime}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Submission to completion duration
          </p>
        </div>

        {/* Metric 3: Estimated Time Saved */}
        <div>
          <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Estimated Time Saved
          </div>
          <div className="mt-2 text-2xl font-bold text-red-400 font-sans tracking-tight font-mono">
            {loading ? "—" : timeSaved}
          </div>
          <p className="mt-1 text-[11px] text-gray-400">
            Illustrative estimate: (baseline - runtime) × count. Not an unverified claim.
          </p>
        </div>
      </div>
    </div>
  );
}
