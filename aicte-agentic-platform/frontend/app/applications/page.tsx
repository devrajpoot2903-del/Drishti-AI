"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { RecentApplicationsTable } from "@/components/dashboard/recent-applications";
import { fetchApplications } from "@/lib/api";
import { Application } from "@/lib/types";

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchApplications();
      setApplications(data);
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
      <Sidebar className="hidden md:flex" />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          title="Applications"
          subtitle="Directory of institutional approval requests and scrutiny status"
          showNewButton={true}
        />

        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          <RecentApplicationsTable
            applications={applications}
            loading={loading}
            error={error}
            onRefresh={loadData}
            onActionComplete={loadData}
          />
        </main>
      </div>
    </div>
  );
}
