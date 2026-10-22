"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import {
  fetchApplications,
  approveApplicationApi,
  rectifyApplicationApi,
  escalateApplicationApi,
} from "@/lib/api";
import { Application } from "@/lib/types";

export default function ReviewPage() {
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [key: string]: string }>({});
  const [confirmApprove, setConfirmApprove] = useState<{ [key: string]: boolean }>({});
  const [isSubmitting, setIsSubmitting] = useState<{ [key: string]: boolean }>({});
  const [feedback, setFeedback] = useState<{
    [key: string]: { type: "success" | "error"; text: string };
  }>({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const allApps = await fetchApplications();
      setItems(allApps.filter((a) => a.status === "Needs Review"));
    } catch (err: any) {
      setError(err?.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAction = async (
    id: string,
    action: "approve" | "rectify" | "escalate"
  ) => {
    const note = notes[id]?.trim() || "";

    if (action === "approve" && !confirmApprove[id]) {
      setFeedback((prev) => ({
        ...prev,
        [id]: {
          type: "error",
          text: "Please check confirmation box to approve statutory clearance.",
        },
      }));
      return;
    }

    if ((action === "rectify" || action === "escalate") && !note) {
      setFeedback((prev) => ({
        ...prev,
        [id]: {
          type: "error",
          text: "A documented rationale/directive is strictly required.",
        },
      }));
      return;
    }

    try {
      setIsSubmitting((prev) => ({ ...prev, [id]: true }));
      setFeedback((prev) => ({ ...prev, [id]: undefined as any }));

      if (action === "approve") {
        await approveApplicationApi(id, note);
      } else if (action === "rectify") {
        await rectifyApplicationApi(id, note);
      } else {
        await escalateApplicationApi(id, note);
      }

      await loadData();
    } catch (err: any) {
      setFeedback((prev) => ({
        ...prev,
        [id]: {
          type: "error",
          text: err?.message || "Unable to record official decision. Please try again.",
        },
      }));
    } finally {
      setIsSubmitting((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#08090d] overflow-hidden text-slate-100">
      <Sidebar className="hidden md:flex" />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          title="Human Review"
          subtitle="Statutory scrutiny queue for applications requiring authorized officer determination"
          showNewButton={false}
        />

        <main className="flex-1 overflow-y-auto p-6 max-w-4xl space-y-4">
          <div className="flex items-center justify-between pb-2">
            <h2 className="text-sm font-semibold text-slate-900">
              Applications Requiring Attention ({items.length})
            </h2>
            <span className="text-xs text-slate-500">
              Only authorized scrutiny officers can record official decisions
            </span>
          </div>

          {error && (
            <div className="bg-white rounded-lg border border-slate-200 p-6 text-center text-xs text-rose-700 bg-rose-50/50">
              Unable to connect to the server. Please try again.
            </div>
          )}

          {loading && !error && (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-xs text-slate-400">
              Checking review queue...
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-xs text-slate-500">
              No applications currently require human review.
            </div>
          )}

          {!loading &&
            !error &&
            items.map((app) => (
              <div
                key={app.id}
                className="bg-white rounded-lg border border-slate-200 p-5 space-y-3"
              >
                {/* Header row */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-indigo-600">
                        {app.id}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {app.status}
                      </span>
                    </div>
                    <h3 className="text-xs font-semibold text-slate-900 mt-1">
                      {app.institutionName}
                    </h3>
                  </div>
                </div>

                {/* Evidence-linked findings */}
                <div className="space-y-1.5 bg-slate-50 p-3 rounded border border-slate-150">
                  <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                    Evidence-Linked Findings:
                  </div>
                  {app.findings.length === 0 ? (
                    <p className="text-xs text-slate-500">
                      Discrepancies flagged by system intake. Review application dossier.
                    </p>
                  ) : (
                    app.findings.map((f, fIdx) => (
                      <div
                        key={fIdx}
                        className="text-xs text-slate-700 flex items-start gap-1.5"
                      >
                        <span className="text-slate-400">•</span>
                        <span>
                          <strong>[{f.severity} Severity]</strong> {f.title}:{" "}
                          {f.detail}
                        </span>
                      </div>
                    ))
                  )}
                  {app.documents.length > 0 && (
                    <div className="text-[11px] text-slate-400 pt-1 font-mono">
                      Source Documents:{" "}
                      {app.documents.map((d) => d.name).join(", ")}
                    </div>
                  )}
                </div>

                {/* Feedback message */}
                {feedback[app.id] && (
                  <div
                    className={`p-2 rounded text-xs ${
                      feedback[app.id].type === "error"
                        ? "bg-rose-50 text-rose-700 border border-rose-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    }`}
                  >
                    {feedback[app.id].text}
                  </div>
                )}

                {/* Officer Directives Input */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    Officer Scrutiny Directive / Notes (required for Rectification or Escalation):
                  </label>
                  <input
                    type="text"
                    placeholder="Enter observation, statutory rationale, or directive..."
                    value={notes[app.id] || ""}
                    onChange={(e) =>
                      setNotes({ ...notes, [app.id]: e.target.value })
                    }
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:bg-white"
                  />
                </div>

                {/* Approval Confirmation checkbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-[11px] text-slate-600">
                    <input
                      type="checkbox"
                      checked={confirmApprove[app.id] || false}
                      onChange={(e) =>
                        setConfirmApprove({
                          ...confirmApprove,
                          [app.id]: e.target.checked,
                        })
                      }
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>
                      I confirm statutory inspection compliance under APH 2026–27 to approve.
                    </span>
                  </label>
                </div>

                {/* Action Controls: Approve | Request Rectification | Escalate */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-white/10 flex-wrap">
                  <button
                    onClick={() => handleAction(app.id, "escalate")}
                    disabled={isSubmitting[app.id]}
                    className="px-3 py-1.5 rounded text-xs font-medium text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-50"
                  >
                    Escalate
                  </button>
                  <button
                    onClick={() => handleAction(app.id, "rectify")}
                    disabled={isSubmitting[app.id]}
                    className="px-3 py-1.5 rounded text-xs font-medium text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors disabled:opacity-50"
                  >
                    Request Rectification
                  </button>
                  <button
                    onClick={() => handleAction(app.id, "approve")}
                    disabled={isSubmitting[app.id]}
                    className="px-3 py-1.5 rounded text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    Approve
                  </button>
                </div>
              </div>
            ))}
        </main>
      </div>
    </div>
  );
}
