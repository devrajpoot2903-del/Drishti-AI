"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { AgentWorkflowStage, AgentExecutionStatus } from "@/lib/types";

interface AgentActivityPanelProps {
  workflow: AgentWorkflowStage[] | null;
  loading: boolean;
  error: string | null;
}

export function AgentActivityPanel({
  workflow,
  loading,
  error,
}: AgentActivityPanelProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const getStatusBadge = (status: AgentExecutionStatus) => {
    switch (status) {
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Completed
          </span>
        );
      case "Running":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-400" />
            Running
          </span>
        );
      case "Needs Review":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">
            <AlertCircle className="w-3 h-3 text-orange-400" />
            Needs Review
          </span>
        );
      case "Skipped":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            <MinusCircle className="w-3 h-3 text-gray-400" />
            Skipped
          </span>
        );
      case "Failed":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
            <XCircle className="w-3 h-3 text-rose-400" />
            Failed
          </span>
        );
      case "Not Started":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-white/5 px-2 py-0.5 rounded border border-white/10">
            Not Started
          </span>
        );
    }
  };

  if (error) {
    return (
      <div className="drishti-card p-5 text-xs text-rose-400 bg-rose-500/10 border-rose-500/20">
        Unable to connect to the server. Please try again.
      </div>
    );
  }

  return (
    <div className="drishti-card p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
        <div>
          <h2 className="text-sm font-semibold text-white tracking-tight">
            AI Processing Pipeline
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Workflow: Intake → Document → Orchestrator → Compliance → Report
          </p>
        </div>

        <div className="text-xs text-gray-400 font-mono">
          {loading
            ? "Loading status..."
            : workflow
            ? `${
                workflow.filter((w) => w.status === "Completed").length
              } of ${workflow.length} Stages Completed`
            : "Standby"}
        </div>
      </div>

      {/* Pipeline Sequence */}
      {loading || !workflow ? (
        <div className="py-8 text-center text-xs text-gray-500 animate-pulse">
          Loading pipeline status...
        </div>
      ) : (
        <div className="py-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {workflow.map((stage) => {
              const isExpanded = expandedId === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => setExpandedId(isExpanded ? null : stage.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    isExpanded
                      ? "border-red-500/60 bg-red-500/10 shadow-sm"
                      : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-mono text-gray-400 font-bold">
                      {stage.number}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        stage.status === "Completed"
                          ? "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                          : stage.status === "Needs Review"
                          ? "bg-amber-400 shadow-sm shadow-amber-400/50"
                          : stage.status === "Running"
                          ? "bg-red-400 shadow-sm shadow-red-400/50 animate-pulse"
                          : stage.status === "Failed"
                          ? "bg-rose-500 shadow-sm shadow-rose-500/50"
                          : "bg-gray-600"
                      }`}
                    />
                  </div>
                  <div className="text-xs font-semibold text-white">
                    {stage.name}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-0.5">
                    {stage.status}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Expanded Stage Details */}
          {expandedId && (
            <div className="mt-4 pt-3 border-t border-white/10">
              {(() => {
                const current = workflow.find((s) => s.id === expandedId);
                if (!current) return null;

                return (
                  <div className="p-4 rounded-xl bg-[#0e0f14] border border-white/10 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-white">
                          {current.name}
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {current.description}
                        </p>
                        {current.reason && (
                          <p className="text-[11px] text-gray-400 italic mt-1">
                            Status Reason: {current.reason}
                          </p>
                        )}
                      </div>
                      <div>{getStatusBadge(current.status)}</div>
                    </div>

                    {/* Conditional branches (Forensics / Verification) */}
                    {current.subModules && current.subModules.length > 0 && (
                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                          Conditional Branch Executions:
                        </div>
                        {current.subModules.map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-3 rounded-lg bg-[#14151c] border border-white/10 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-semibold text-white">
                                {sub.name}
                                <span className="text-gray-400 font-normal ml-2 font-mono text-[10px]">
                                  ({sub.engine})
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-400 mt-0.5">
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
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
