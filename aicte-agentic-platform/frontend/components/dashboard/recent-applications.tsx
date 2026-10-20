"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  X,
  Plus,
  ShieldCheck,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react";
import { Application, Finding } from "@/lib/types";
import { EvidenceModal } from "./evidence-modal";
import {
  approveApplicationApi,
  rectifyApplicationApi,
  escalateApplicationApi,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface RecentApplicationsTableProps {
  applications: Application[];
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
  onActionComplete?: () => void;
}

export function RecentApplicationsTable({
  applications,
  loading,
  error,
  onRefresh,
  onActionComplete,
}: RecentApplicationsTableProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [activeTab, setActiveTab] = useState<
    "Overview" | "Documents" | "AI Findings" | "Review History"
  >("Overview");

  // Evidence Modal state
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null);
  const [evidenceModalOpen, setEvidenceModalOpen] = useState(false);

  // Official Action state
  const [actionType, setActionType] = useState<
    "approve" | "rectify" | "escalate" | null
  >(null);
  const [actionReason, setActionReason] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const filtered = applications.filter(
    (app) =>
      app.institutionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: Application["status"]) => {
    switch (status) {
      case "Cleared":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Cleared
          </span>
        );
      case "Needs Review":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            Needs Review
          </span>
        );
      case "Processing":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
            <Clock className="w-3 h-3 text-indigo-600" />
            Processing
          </span>
        );
      case "Submitted":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            Submitted
          </span>
        );
    }
  };

  const handleOpenEvidence = (finding: Finding) => {
    setSelectedFinding(finding);
    setEvidenceModalOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedApp || !actionType) return;

    if (actionType === "approve" && !isConfirmed) {
      setActionMessage({
        type: "error",
        text: "Please check confirmation box to approve statutory clearance.",
      });
      return;
    }

    if ((actionType === "rectify" || actionType === "escalate") && !actionReason.trim()) {
      setActionMessage({
        type: "error",
        text: "A documented rationale/reason is strictly required.",
      });
      return;
    }

    setActionLoading(true);
    setActionMessage(null);

    try {
      let updated: Application;
      if (actionType === "approve") {
        updated = await approveApplicationApi(selectedApp.id, actionReason);
      } else if (actionType === "rectify") {
        updated = await rectifyApplicationApi(selectedApp.id, actionReason);
      } else {
        updated = await escalateApplicationApi(selectedApp.id, actionReason);
      }

      setSelectedApp(updated);
      setActionMessage({
        type: "success",
        text: `Action successfully recorded and logged to audit trail.`,
      });
      setActionType(null);
      setActionReason("");
      setIsConfirmed(false);
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      setActionMessage({
        type: "error",
        text: err?.message || "Failed to execute review action.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-8 text-center space-y-3">
        <p className="text-xs text-rose-700 font-medium">
          Unable to connect to the server. Please try again.
        </p>
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
            Recent Applications
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Submitted applications and regulatory validation status
          </p>
        </div>

        {applications.length > 0 && (
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID or institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        )}
      </div>

      {/* Body Content */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          Loading applications...
        </div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center space-y-3">
          <p className="text-xs text-slate-500">
            No applications have been submitted yet.
          </p>
          <p className="text-[11px] text-slate-400">
            Upload your first application to begin document validation.
          </p>
          <div className="pt-2">
            <Link
              href="/upload"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Application</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                <th className="py-2.5 px-4">Application ID</th>
                <th className="py-2.5 px-4">Institution</th>
                <th className="py-2.5 px-4">Submission Date</th>
                <th className="py-2.5 px-4">Risk Score</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((app) => (
                <tr
                  key={app.id}
                  onClick={() => {
                    setSelectedApp(app);
                    setActiveTab("Overview");
                    setActionType(null);
                    setActionMessage(null);
                  }}
                  className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-mono font-medium text-indigo-600">
                    {app.id}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-slate-900">
                      {app.institutionName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {app.category}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                    {app.submissionDate}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    {app.riskScore !== undefined ? (
                      <span
                        className={
                          app.riskScore >= 70
                            ? "text-rose-600 font-medium"
                            : app.riskScore >= 40
                            ? "text-amber-600 font-medium"
                            : "text-emerald-600 font-medium"
                        }
                      >
                        {app.riskScore}/100
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="py-3 px-4">{getStatusBadge(app.status)}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedApp(app);
                        setActiveTab("Overview");
                        setActionType(null);
                        setActionMessage(null);
                      }}
                      className="px-2.5 py-1 rounded text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabbed Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-indigo-600">
                    {selectedApp.id}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-600">
                    {selectedApp.category}
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-slate-900 mt-0.5">
                  {selectedApp.institutionName}
                </h3>
              </div>
              <button
                onClick={() => setSelectedApp(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Four Clean Tabs */}
            <div className="flex items-center border-b border-slate-200 px-4 bg-white text-xs font-medium text-slate-500">
              {(
                ["Overview", "Documents", "AI Findings", "Review History"] as const
              ).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2.5 px-3 border-b-2 transition-colors ${
                    activeTab === tab
                      ? "border-indigo-600 text-indigo-600 font-semibold"
                      : "border-transparent hover:text-slate-900"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1">
              {/* Tab 1: Overview */}
              {activeTab === "Overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded border border-slate-200 bg-slate-50">
                      <div className="text-[10px] uppercase font-medium text-slate-400">
                        Application Type
                      </div>
                      <div className="mt-1 font-medium text-slate-800">
                        {selectedApp.approvalType}
                      </div>
                    </div>
                    <div className="p-3 rounded border border-slate-200 bg-slate-50">
                      <div className="text-[10px] uppercase font-medium text-slate-400">
                        Academic Year
                      </div>
                      <div className="mt-1 font-mono text-slate-800">
                        {selectedApp.academicYear}
                      </div>
                    </div>
                    <div className="p-3 rounded border border-slate-200 bg-slate-50">
                      <div className="text-[10px] uppercase font-medium text-slate-400">
                        Submission Date
                      </div>
                      <div className="mt-1 font-mono text-slate-800">
                        {selectedApp.submissionDate}
                      </div>
                    </div>
                    <div className="p-3 rounded border border-slate-200 bg-slate-50">
                      <div className="text-[10px] uppercase font-medium text-slate-400">
                        Current Status
                      </div>
                      <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-800 mb-1">
                      Scrutiny Summary
                    </h4>
                    <p className="text-xs text-slate-600 p-3 rounded border border-slate-200 bg-slate-50 leading-relaxed">
                      {selectedApp.summary ||
                        "Application registered. Awaiting automated or manual scrutiny execution."}
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 2: Documents */}
              {activeTab === "Documents" && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-800 mb-2">
                    Attached Documents ({selectedApp.documents.length})
                  </div>
                  {selectedApp.documents.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No documents attached to this application.
                    </p>
                  ) : (
                    selectedApp.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded border border-slate-200 bg-white flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-slate-800 truncate">
                              {doc.name}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              SHA-256: {doc.hash}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 ml-2">
                          {doc.ocrStatus}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 3: AI Findings with View Evidence button */}
              {activeTab === "AI Findings" && (
                <div className="space-y-3">
                  {selectedApp.findings.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-200">
                      No AI findings available. Document analysis has not been
                      completed.
                    </div>
                  ) : (
                    selectedApp.findings.map((finding) => (
                      <div
                        key={finding.id}
                        className="p-3.5 rounded border border-slate-200 bg-slate-50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">
                            {finding.title}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                finding.severity === "High"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : finding.severity === "Medium"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              {finding.severity} Severity
                            </span>
                            {/* View Evidence Button */}
                            <button
                              onClick={() => handleOpenEvidence(finding)}
                              className="px-2 py-0.5 rounded text-[11px] font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-colors inline-flex items-center gap-1"
                            >
                              <span>View Evidence</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {finding.detail}
                        </p>

                        {finding.supportingEvidence && (
                          <div className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200">
                            <span className="font-semibold text-slate-600">
                              Supporting Evidence:{" "}
                            </span>
                            {finding.supportingEvidence}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                          {finding.tool && <span>Tool: {finding.tool}</span>}
                          {finding.confidence !== undefined && (
                            <span>Confidence: {finding.confidence}%</span>
                          )}
                          {finding.documentRef && (
                            <span>Ref: {finding.documentRef}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 4: Review History */}
              {activeTab === "Review History" && (
                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-800">
                    Application Audit History
                  </div>

                  {selectedApp.history.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      No review actions recorded yet.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedApp.history.map((h) => (
                        <div
                          key={h.id}
                          className="p-2.5 rounded border border-slate-200 bg-slate-50 flex items-start gap-2"
                        >
                          <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap mt-0.5">
                            {h.timestamp}
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800">
                              {h.actor}:
                            </span>{" "}
                            <span className="text-slate-600 text-[11px]">
                              {h.action}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Human Review Action Controls (Approve | Request Rectification | Escalate) */}
              <div className="pt-3 border-t border-slate-200 space-y-3 bg-slate-50/70 p-3 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    Authorized Official Determination
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {user ? `Official: ${user.name} (${user.role})` : "Authenticated Official"}
                  </span>

                </div>

                {actionMessage && (
                  <div
                    className={`p-2.5 rounded text-xs ${
                      actionMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : "bg-rose-50 text-rose-800 border border-rose-200"
                    }`}
                  >
                    {actionMessage.text}
                  </div>
                )}

                {/* Primary 3 Decision Buttons */}
                {!actionType ? (
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    <button
                      onClick={() => setActionType("approve")}
                      className="px-3 py-1.5 rounded text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setActionType("rectify")}
                      className="px-3 py-1.5 rounded text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors"
                    >
                      Request Rectification
                    </button>
                    <button
                      onClick={() => setActionType("escalate")}
                      className="px-3 py-1.5 rounded text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                    >
                      Escalate
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-white rounded border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-900 capitalize">
                        Confirm Decision: {actionType}
                      </span>
                      <button
                        onClick={() => {
                          setActionType(null);
                          setActionReason("");
                          setIsConfirmed(false);
                          setActionMessage(null);
                        }}
                        className="text-[11px] text-slate-400 hover:text-slate-600"
                      >
                        Cancel
                      </button>
                    </div>

                    {actionType === "approve" ? (
                      <div className="space-y-2">
                        <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-700">
                          <input
                            type="checkbox"
                            checked={isConfirmed}
                            onChange={(e) => setIsConfirmed(e.target.checked)}
                            className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span>
                            I confirm that statutory norms under APH 2026–27 have been
                            verified and grant regulatory approval.
                          </span>
                        </label>
                        <input
                          type="text"
                          placeholder="Optional approval notes or conditions..."
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-medium text-slate-700">
                          {actionType === "rectify"
                            ? "Documented Rectification Mandate:"
                            : "Escalation Justification for Standing Appellate Committee:"}
                        </label>
                        <textarea
                          rows={2}
                          required
                          placeholder={
                            actionType === "rectify"
                              ? "Specify deficiency (e.g. Provide valid Fire NOC renewal proof within 15 days)..."
                              : "Specify reason for escalation (e.g. Forged surveyor seal detected; referral to SAC committee)..."
                          }
                          value={actionReason}
                          onChange={(e) => setActionReason(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                    )}

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={handleExecuteAction}
                        disabled={actionLoading}
                        className="px-3 py-1.5 rounded text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-50"
                      >
                        {actionLoading ? "Recording Decision..." : "Submit Determination"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedApp(null)}
                className="px-3 py-1.5 rounded text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Forensic Evidence Viewer Modal */}
      <EvidenceModal
        finding={selectedFinding}
        open={evidenceModalOpen}
        onOpenChange={setEvidenceModalOpen}
      />
    </div>
  );
}
