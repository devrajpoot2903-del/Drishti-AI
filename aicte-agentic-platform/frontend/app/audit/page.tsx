"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Search, Lock } from "lucide-react";
import { fetchAuditLogs } from "@/lib/api";
import { AuditEvent } from "@/lib/types";

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAuditLogs();
      setEvents(data);
    } catch (err: any) {
      setError(err?.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredLogs = events.filter(
    (l) =>
      l.appId.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.actor.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-[#08090d] overflow-hidden text-slate-100">
      <Sidebar className="hidden md:flex" />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          title="Audit & Reports"
          subtitle="Cryptographic verification logs and immutable agentic decision provenance"
          showNewButton={false}
        />

        <main className="flex-1 overflow-y-auto p-6 max-w-5xl space-y-4">
          {/* Header Controls */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Provenance Chain
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every agent execution and officer determination is hashed and chained
              </p>
            </div>

            {events.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter logs by app ID or actor..."
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-xs text-rose-700 bg-rose-50/50">
              Unable to connect to the server. Please try again.
            </div>
          )}

          {loading && !error && (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-xs text-slate-400">
              Loading audit provenance logs...
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-xs text-slate-500">
              No audit events recorded yet.
            </div>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="bg-white rounded-lg border border-slate-200 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                    <th className="py-2.5 px-4">Timestamp</th>
                    <th className="py-2.5 px-4">Application</th>
                    <th className="py-2.5 px-4">Actor</th>
                    <th className="py-2.5 px-4">Action Summary</th>
                    <th className="py-2.5 px-4">SHA-256 Provenance</th>
                    <th className="py-2.5 px-4 text-right">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-white/[0.04] active:bg-white/[0.06] transition-colors"
                    >
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 font-mono font-medium text-indigo-600 whitespace-nowrap">
                        {log.appId}
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 whitespace-nowrap">
                        {log.actor}
                      </td>
                      <td className="py-3 px-4 text-slate-600 text-xs">
                        {log.action}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-slate-400">
                        {log.hash.substring(0, 16)}...
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Lock className="w-2.5 h-2.5 text-emerald-600" />
                          {log.hashChainStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
