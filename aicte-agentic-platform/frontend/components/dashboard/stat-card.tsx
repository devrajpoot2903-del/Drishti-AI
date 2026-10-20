"use client";

import React from "react";
import { DashboardStats } from "@/lib/types";

interface StatCardsGridProps {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
}

export function StatCard({
  label,
  value,
  description,
  loading,
}: {
  label: string;
  value: string | number;
  description: string;
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        {loading ? (
          <span className="text-2xl font-semibold text-slate-300 animate-pulse font-mono">
            —
          </span>
        ) : (
          <span className="text-2xl font-semibold text-slate-900 font-sans tracking-tight">
            {value}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

export function StatCardsGrid({ stats, loading, error }: StatCardsGridProps) {
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-5 text-xs text-rose-700 bg-rose-50/50">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <StatCard
        label="Total Applications"
        value={stats !== null ? stats.totalApplications : "—"}
        description="Institutional applications recorded in database"
        loading={loading}
      />
      <StatCard
        label="Processed"
        value={stats !== null ? stats.processed : "—"}
        description="Applications with completed analysis"
        loading={loading}
      />
      <StatCard
        label="Needs Review"
        value={stats !== null ? stats.needsReview : "—"}
        description="Applications requiring scrutiny officer action"
        loading={loading}
      />
    </div>
  );
}
