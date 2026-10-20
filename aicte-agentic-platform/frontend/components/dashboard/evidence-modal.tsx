"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Finding } from "@/lib/types";
import { FileText, ShieldAlert, CheckCircle2, AlertCircle } from "lucide-react";

interface EvidenceModalProps {
  finding: Finding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EvidenceModal({
  finding,
  open,
  onOpenChange,
}: EvidenceModalProps) {
  if (!finding) return null;

  const rawEvidence = finding.evidence;
  if (!rawEvidence) return null;

  const evidence = {
    ...rawEvidence,
    documentName: rawEvidence.documentName || (rawEvidence as any).documentRef || "Document",
    pageNumber: rawEvidence.pageNumber !== undefined ? rawEvidence.pageNumber : (rawEvidence as any).page,
    heatmapUrl: rawEvidence.heatmapUrl || (rawEvidence as any).imageUrl,
    methodUsed: rawEvidence.methodUsed || finding.tool || "Automated Analysis",
    description: rawEvidence.description || finding.detail || ""
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl bg-white p-6 border border-slate-200 rounded-xl shadow-lg">
        <DialogHeader className="space-y-1 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-semibold uppercase ${
                finding.severity === "High"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : finding.severity === "Medium"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {finding.severity} Severity
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Category: {finding.category}
            </span>
          </div>
          <DialogTitle className="text-base font-semibold text-slate-900 tracking-tight">
            {finding.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            {finding.detail}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4 text-xs">
          {!evidence ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-slate-200">
              Evidence is not available for this finding.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-medium text-slate-400">
                    Analysis Method
                  </div>
                  <div className="font-medium text-slate-800 mt-0.5 truncate">
                    {evidence.methodUsed}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-medium text-slate-400">
                    Document Ref
                  </div>
                  <div className="font-medium text-slate-800 mt-0.5 truncate">
                    {evidence.documentName}
                    {evidence.pageNumber !== undefined && (
                      <span className="text-slate-400 ml-1">
                        (p. {evidence.pageNumber})
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-50 border border-slate-200">
                  <div className="text-[10px] uppercase font-medium text-slate-400">
                    Confidence
                  </div>
                  <div className="font-medium font-mono text-slate-800 mt-0.5">
                    {evidence.confidence !== undefined
                      ? `${evidence.confidence}%`
                      : "Not measured"}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="p-3 rounded bg-slate-50 border border-slate-200">
                <div className="text-[11px] font-semibold text-slate-700 mb-1">
                  Evidence Analysis & Findings:
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  {evidence.description}
                </p>
              </div>

              {/* Document / Heatmap Previews (if real URLs are present) */}
              {(evidence.originalUrl || evidence.heatmapUrl) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {evidence.originalUrl && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase text-slate-500">
                        Original Document Region
                      </div>
                      <div className="rounded border border-slate-200 p-2 bg-slate-50 flex items-center justify-center min-h-[140px]">
                        <img
                          src={evidence.originalUrl.startsWith("http") ? evidence.originalUrl : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}${evidence.originalUrl.startsWith("/") ? "" : "/"}${evidence.originalUrl}`}
                          alt="Original document region"
                          className="max-h-36 object-contain rounded"
                        />
                      </div>
                    </div>
                  )}

                  {evidence.heatmapUrl && (
                    <div className="space-y-1.5">
                      <div className="text-[10px] font-semibold uppercase text-slate-500">
                        ELA Heatmap Anomaly
                      </div>
                      <div className="rounded border border-slate-200 p-2 bg-slate-50 flex items-center justify-center min-h-[140px]">
                        <img
                          src={evidence.heatmapUrl.startsWith("http") ? evidence.heatmapUrl : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001"}${evidence.heatmapUrl.startsWith("/") ? "" : "/"}${evidence.heatmapUrl}`}
                          alt="Error Level Analysis Heatmap"
                          className="max-h-36 object-contain rounded"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}


              {/* Bounding Boxes if available */}
              {evidence.boundingBoxes && evidence.boundingBoxes.length > 0 && (
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-[11px] space-y-1">
                  <div className="font-semibold text-slate-700">
                    Detected Anomaly Regions ({evidence.boundingBoxes.length}):
                  </div>
                  {evidence.boundingBoxes.map((b, bIdx) => (
                    <div key={bIdx} className="text-slate-600 font-mono text-[10px]">
                      • {b.label}: [x: {b.x}, y: {b.y}, w: {b.width}, h: {b.height}]
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
