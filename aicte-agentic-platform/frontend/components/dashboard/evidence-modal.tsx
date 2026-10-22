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
import { EvidenceComparison } from "@/components/drishti/evidence-comparison";

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
    originalUrl: rawEvidence.originalUrl,
    methodUsed: rawEvidence.methodUsed || finding.tool || "Automated Analysis",
    description: rawEvidence.description || finding.detail || ""
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#0d0f17] p-6 border border-white/10 rounded-2xl shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 pb-3 border-b border-white/10">
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
          <DialogTitle className="text-base font-semibold text-slate-100 tracking-tight">
            {finding.title}
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            {finding.detail}
          </DialogDescription>
        </DialogHeader>

        <div className="py-2 space-y-4 text-xs">
          {!evidence ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white/5 rounded-xl border border-white/10">
              Evidence is not available for this finding.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Evidence Comparison Side-by-Side (Feature 3) */}
              <EvidenceComparison
                documentUrl={evidence.originalUrl}
                heatmapUrl={evidence.heatmapUrl}
                method={evidence.methodUsed}
                description={evidence.description}
              />

              {/* Bounding Boxes if available */}
              {evidence.boundingBoxes && evidence.boundingBoxes.length > 0 && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] space-y-1">
                  <div className="font-semibold text-slate-300">
                    Detected Anomaly Regions ({evidence.boundingBoxes.length}):
                  </div>
                  {evidence.boundingBoxes.map((b, bIdx) => (
                    <div key={bIdx} className="text-slate-400 font-mono text-[10px]">
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
