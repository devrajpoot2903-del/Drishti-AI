"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  AlertCircle,
  Loader2,
  Shield,
  FileSearch,
  Scale,
  Sparkles,
} from "lucide-react";
import { fetchApplicationExecutions } from "@/lib/api";

export type Execution = {
  id: string;
  agentName: string;
  status: string;
  startedAt: string;
  completedAt?: string | null;
  routingReason?: string | null;
  toolUsed?: string | null;
};

interface Props {
  applicationId: string;
}

export function AgentTimeline({ applicationId }: Props) {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadExecutions() {
      try {
        // Try authenticated API client first
        let list: Execution[] = [];
        try {
          list = await fetchApplicationExecutions(applicationId);
        } catch {
          // Fallback to direct relative fetch
          const response = await fetch(
            `/api/applications/${applicationId}/executions`,
            { cache: "no-store" }
          );
          if (!response.ok) {
            throw new Error("Unable to load agent executions");
          }
          const data = await response.json();
          list = data.executions ?? [];
        }

        if (active) {
          setExecutions(list);
          setError(null);
        }
      } catch {
        if (active) {
          setError("Unable to retrieve execution history.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadExecutions();

    const interval = setInterval(loadExecutions, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [applicationId]);

  function getIcon(status: string) {
    switch (status.toLowerCase()) {
      case "completed":
        return <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />;

      case "running":
        return <Loader2 size={18} className="animate-spin text-amber-400 shrink-0" />;

      case "failed":
        return <AlertCircle size={18} className="text-rose-400 shrink-0" />;

      case "skipped":
        return <Clock3 size={18} className="text-slate-500 shrink-0" />;

      default:
        return <Clock3 size={18} className="text-slate-400 shrink-0" />;
    }
  }

  function getAgentBadge(agentName: string) {
    const name = agentName.toLowerCase();
    if (name.includes("forensic")) {
      return (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/10 text-purple-300 border border-purple-500/20">
          <FileSearch size={11} /> Forensics
        </span>
      );
    }
    if (name.includes("verif")) {
      return (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
          <Shield size={11} /> Verification Ladder
        </span>
      );
    }
    if (name.includes("compli")) {
      return (
        <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
          <Scale size={11} /> APH Rules
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-slate-500/10 text-slate-300 border border-slate-500/20">
        <Sparkles size={11} /> Autonomous Agent
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-6 text-sm text-slate-400">
        <Loader2 size={16} className="animate-spin text-indigo-400" />
        <span>Loading execution history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div role="alert" className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-sm text-rose-300">
        {error}
      </div>
    );
  }

  if (executions.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-slate-400 rounded-xl bg-slate-900/40 border border-white/5">
        No agent executions recorded yet.
      </div>
    );
  }

  return (
    <div className="drishti-glass rounded-xl p-6 border border-white/10 bg-slate-900/60 backdrop-blur-md">
      <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
        <div>
          <h3 className="text-base font-semibold text-white tracking-wide">
            Autonomous Agent Execution Timeline
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time step-by-step verification trace for dossier {applicationId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider">Live Polling</span>
        </div>
      </div>

      <div className="space-y-5">
        {executions.map((execution, index) => {
          const isLast = index === executions.length - 1;
          const statusLower = execution.status.toLowerCase();

          return (
            <div key={execution.id || index} className="relative flex items-start gap-4">
              {/* Connector vertical line */}
              {!isLast && (
                <div className="absolute left-[9px] top-6 bottom-[-20px] w-px bg-white/10" />
              )}

              <div className="mt-0.5 relative z-10 bg-slate-900 p-0.5 rounded-full">
                {getIcon(execution.status)}
              </div>

              <div className="flex-1 pb-4 border-b border-white/5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-sm text-white">
                      {execution.agentName}
                    </h4>
                    {getAgentBadge(execution.agentName)}
                  </div>

                  <span className="text-xs font-mono text-slate-400">
                    {execution.startedAt ? new Date(execution.startedAt).toLocaleTimeString() : "—"}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="text-slate-500">Status:</span>
                    <span
                      className={`font-medium ${
                        statusLower === "completed"
                          ? "text-emerald-400"
                          : statusLower === "running"
                          ? "text-amber-400"
                          : statusLower === "skipped"
                          ? "text-slate-500"
                          : "text-rose-400"
                      }`}
                    >
                      {execution.status}
                    </span>
                  </span>

                  {execution.toolUsed && (
                    <span className="text-xs text-slate-400 font-mono truncate max-w-md">
                      <span className="text-slate-500">Tool:</span> {execution.toolUsed}
                    </span>
                  )}
                </div>

                {execution.routingReason && (
                  <div className="mt-2 text-xs text-slate-400 bg-white/5 px-2.5 py-1.5 rounded border border-white/5">
                    <span className="text-slate-500 font-medium mr-1.5">Routing Decision:</span>
                    {execution.routingReason}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
