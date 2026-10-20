"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { fetchWorkflow } from "@/lib/api";
import { AgentWorkflowStage, AgentExecutionStatus } from "@/lib/types";

export default function AgentsPage() {
  const [stages, setStages] = useState<AgentWorkflowStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string>("routing");

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchWorkflow();
      setStages(data);
    } catch (err: any) {
      setError(err?.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: AgentExecutionStatus) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Completed
          </span>
        );
      case "Running":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            <Clock className="w-3 h-3 text-indigo-600" />
            Running
          </span>
        );
      case "Needs Review":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Needs Review
          </span>
        );
      case "Skipped":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            <MinusCircle className="w-3 h-3 text-slate-500" />
            Skipped
          </span>
        );
      case "Failed":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            Failed
          </span>
        );
      case "Not Started":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            Not Started
          </span>
        );
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC] overflow-hidden">
      <Sidebar className="hidden md:flex" />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          title="AI Processing"
          subtitle="Multi-agent workflow: Intake → Document → Orchestrator → Compliance → Report"
          showNewButton={false}
        />

        <main className="flex-1 overflow-y-auto p-6 max-w-5xl space-y-4">
          {/* Linear Sequence Header */}
          <div className="bg-white rounded-lg border border-slate-200 p-4 flex items-center justify-between text-xs font-medium text-slate-700 overflow-x-auto">
            <span className="text-slate-400 font-mono text-[11px]">Workflow:</span>
            <span>Intake</span>
            <span className="text-slate-300">→</span>
            <span>Document</span>
            <span className="text-slate-300">→</span>
            <span className="font-semibold text-indigo-600">
              Orchestrator (Forensics & Verification)
            </span>
            <span className="text-slate-300">→</span>
            <span>Compliance</span>
            <span className="text-slate-300">→</span>
            <span>Report</span>
          </div>

          {error && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-xs text-rose-700 bg-rose-50/50">
              Unable to connect to the server. Please try again.
            </div>
          )}

          {loading && !error && (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-xs text-slate-400">
              Loading agent execution states...
            </div>
          )}

          {!loading && !error && (
            <div className="space-y-3">
              {stages.map((stage) => {
                const isExpanded = expandedId === stage.id;

                return (
                  <div
                    key={stage.id}
                    className="bg-white rounded-lg border border-slate-200 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedId(isExpanded ? "" : stage.id)
                      }
                      className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs text-slate-400">
                          {stage.number}
                        </span>
                        <div>
                          <div className="text-xs font-semibold text-slate-900">
                            {stage.name}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                            {stage.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        {stage.duration && (
                          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                            {stage.duration}
                          </span>
                        )}
                        {getStatusBadge(stage.status)}
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </button>

                    {/* Stage Details */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3">
                        {stage.reason && (
                          <p className="text-[11px] text-slate-500 italic">
                            Status Reason: {stage.reason}
                          </p>
                        )}

                        {stage.subModules && stage.subModules.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                              Conditional Branch Executions:
                            </div>
                            {stage.subModules.map((sub, sIdx) => (
                              <div
                                key={sIdx}
                                className="p-3 rounded border border-slate-200 bg-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                              >
                                <div>
                                  <div className="font-medium text-slate-900">
                                    {sub.name}
                                    <span className="text-slate-400 font-normal ml-2 font-mono text-[10px]">
                                      ({sub.engine})
                                    </span>
                                  </div>
                                  <p className="text-slate-600 text-[11px] mt-0.5">
                                    {sub.findings ||
                                      sub.reason ||
                                      "Awaiting execution criteria."}
                                  </p>
                                </div>
                                <div>{getStatusBadge(sub.status)}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
