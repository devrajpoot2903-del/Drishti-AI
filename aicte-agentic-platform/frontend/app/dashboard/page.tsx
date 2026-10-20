"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { StatCardsGrid } from "@/components/dashboard/stat-card";
import { RecentApplicationsTable } from "@/components/dashboard/recent-applications";
import { AgentActivityPanel } from "@/components/dashboard/agent-activity";
import { ImpactMeter } from "@/components/dashboard/impact-meter";
import {
  fetchStats,
  fetchApplications,
  fetchWorkflow,
  fetchImpactMetrics,
} from "@/lib/api";
import {
  Application,
  DashboardStats,
  AgentWorkflowStage,
  ImpactMetrics,
} from "@/lib/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [workflow, setWorkflow] = useState<AgentWorkflowStage[] | null>(null);
  const [impactMetrics, setImpactMetrics] = useState<ImpactMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, appsData, workflowData, impactData] = await Promise.all([
        fetchStats(),
        fetchApplications(),
        fetchWorkflow(),
        fetchImpactMetrics(),
      ]);
      setStats(statsData);
      setApplications(appsData);
      setWorkflow(workflowData);
      setImpactMetrics(impactData);
    } catch (err: any) {
      setError(err?.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar className="hidden md:flex" />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Clean Header */}
        <Header
          title="Overview"
          subtitle="Regulatory scrutiny and institutional decision support"
          showNewButton={true}
        />

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Three Statistics Cards: Total, Processed, Needs Review */}
          <StatCardsGrid stats={stats} loading={loading} error={error} />

          {/* Compact AI Processing Pipeline (Linear Workflow) */}
          <AgentActivityPanel
            workflow={workflow}
            loading={loading}
            error={error}
          />

          {/* Recent Applications Table */}
          <RecentApplicationsTable
            applications={applications}
            loading={loading}
            error={error}
            onRefresh={loadData}
            onActionComplete={loadData}
          />

          {/* Processing Impact Meter Card (Bottom of Dashboard) */}
          <ImpactMeter
            metrics={impactMetrics}
            loading={loading}
            error={error}
          />
        </main>
      </div>
    </div>
  );
}
