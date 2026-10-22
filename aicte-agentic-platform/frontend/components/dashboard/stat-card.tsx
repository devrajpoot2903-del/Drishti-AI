"use client";

import React from "react";
import { DashboardStats } from "@/lib/types";
import { AnimatedCard } from "@/components/drishti/animated-card";

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
  delay = 0,
}: {
  label: string;
  value: string | number;
  description: string;
  loading: boolean;
  delay?: number;
}) {
  return (
    <AnimatedCard delay={delay} className="p-5">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        {loading ? (
          <span className="text-2xl font-semibold text-gray-600 animate-pulse font-mono">
            —
          </span>
        ) : (
          <span className="text-3xl font-bold text-white font-sans tracking-tight">
            {value}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-xs text-gray-400 leading-relaxed">{description}</p>
    </AnimatedCard>
  );
}

export function StatCardsGrid({ stats, loading, error }: StatCardsGridProps) {
  if (error) {
    return (
      <div className="drishti-card p-5 text-xs text-rose-400 bg-rose-500/10 border-rose-500/20">
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
        delay={0.05}
      />
      <StatCard
        label="Processed"
        value={stats !== null ? stats.processed : "—"}
        description="Applications with completed analysis"
        loading={loading}
        delay={0.1}
      />
      <StatCard
        label="Needs Review"
        value={stats !== null ? stats.needsReview : "—"}
        description="Applications requiring scrutiny officer action"
        loading={loading}
        delay={0.15}
      />
    </div>
  );
}
