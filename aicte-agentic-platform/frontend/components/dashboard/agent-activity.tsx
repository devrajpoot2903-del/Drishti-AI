"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  MinusCircle,
  HelpCircle,
  ChevronDown,
  ChevronRight,
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

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-5 text-xs text-rose-700 bg-rose-50/50">
        Unable to connect to the server. Please try again.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            AI Processing Pipeline
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Workflow: Intake → Document → Orchestrator → Compliance → Report
          </p>
        </div>

        <div className="text-xs text-slate-500 font-mono">
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
        <div className="py-8 text-center text-xs text-slate-400">
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
                  className={`text-left p-2.5 rounded-md border transition-colors ${
                    isExpanded
                      ? "border-indigo-400 bg-indigo-50/30"
                      : "border-slate-200 bg-slate-50/60 hover:bg-slate-100/60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-400">
                      {stage.number}
                    </span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        stage.status === "Completed"
                          ? "bg-emerald-500"
                          : stage.status === "Needs Review"
                          ? "bg-amber-500"
                          : stage.status === "Running"
                          ? "bg-indigo-500"
                          : stage.status === "Failed"
                          ? "bg-rose-500"
                          : "bg-slate-300"
                      }`}
                    />
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {stage.name}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {stage.status}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Expanded Stage Details */}
          {expandedId && (
            <div className="mt-4 pt-3 border-t border-slate-100">
              {(() => {
                const current = workflow.find((s) => s.id === expandedId);
                if (!current) return null;

                return (
                  <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-slate-900">
                          {current.name}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {current.description}
                        </p>
                        {current.reason && (
                          <p className="text-[11px] text-slate-500 italic mt-1">
                            Status Reason: {current.reason}
                          </p>
                        )}
                      </div>
                      <div>{getStatusBadge(current.status)}</div>
                    </div>

                    {/* Conditional branches (Forensics / Verification) */}
                    {current.subModules && current.subModules.length > 0 && (
                      <div className="pt-2 border-t border-slate-200 space-y-2">
                        <div className="text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                          Conditional Branch Executions:
                        </div>
                        {current.subModules.map((sub, sIdx) => (
                          <div
                            key={sIdx}
                            className="p-2.5 rounded bg-white border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-semibold text-slate-800">
                                {sub.name}
                                <span className="text-slate-400 font-normal ml-2 font-mono text-[10px]">
                                  ({sub.engine})
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 mt-0.5">
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
