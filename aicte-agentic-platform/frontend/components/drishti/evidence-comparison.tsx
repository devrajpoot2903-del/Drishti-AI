"use client";

import { useState, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCcw, FileSearch, ShieldAlert, Image as ImageIcon } from "lucide-react";
import { fetchAuthenticatedBlobUrl } from "@/lib/api";

export interface EvidenceComparisonProps {
  documentUrl?: string | null;
  heatmapUrl?: string | null;
  method: string;
  description: string;
}

export function EvidenceComparison({
  documentUrl,
  heatmapUrl,
  method,
  description,
}: EvidenceComparisonProps) {
  const [zoom, setZoom] = useState(1);
  const [authDocSrc, setAuthDocSrc] = useState<string | null>(null);
  const [authHeatmapSrc, setAuthHeatmapSrc] = useState<string | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [loadingHeatmap, setLoadingHeatmap] = useState(false);

  // Authenticated blob loading with revocation cleanup
  useEffect(() => {
    let active = true;
    let createdDocUrl: string | null = null;

    if (documentUrl) {
      if (documentUrl.startsWith("data:") || documentUrl.startsWith("blob:")) {
        setAuthDocSrc(documentUrl);
      } else {
        setLoadingDoc(true);
        fetchAuthenticatedBlobUrl(documentUrl)
          .then((blobUrl) => {
            if (active) {
              createdDocUrl = blobUrl;
              setAuthDocSrc(blobUrl);
            } else {
              URL.revokeObjectURL(blobUrl);
            }
          })
          .catch(() => {
            if (active) {
              // Fallback to direct url
              setAuthDocSrc(documentUrl);
            }
          })
          .finally(() => {
            if (active) setLoadingDoc(false);
          });
      }
    } else {
      setAuthDocSrc(null);
    }

    return () => {
      active = false;
      if (createdDocUrl) {
        URL.revokeObjectURL(createdDocUrl);
      }
    };
  }, [documentUrl]);

  useEffect(() => {
    let active = true;
    let createdHeatmapUrl: string | null = null;

    if (heatmapUrl) {
      if (heatmapUrl.startsWith("data:") || heatmapUrl.startsWith("blob:")) {
        setAuthHeatmapSrc(heatmapUrl);
      } else {
        setLoadingHeatmap(true);
        fetchAuthenticatedBlobUrl(heatmapUrl)
          .then((blobUrl) => {
            if (active) {
              createdHeatmapUrl = blobUrl;
              setAuthHeatmapSrc(blobUrl);
            } else {
              URL.revokeObjectURL(blobUrl);
            }
          })
          .catch(() => {
            if (active) {
              setAuthHeatmapSrc(heatmapUrl);
            }
          })
          .finally(() => {
            if (active) setLoadingHeatmap(false);
          });
      }
    } else {
      setAuthHeatmapSrc(null);
    }

    return () => {
      active = false;
      if (createdHeatmapUrl) {
        URL.revokeObjectURL(createdHeatmapUrl);
      }
    };
  }, [heatmapUrl]);

  function increaseZoom() {
    setZoom((value) => Math.min(value + 0.2, 2.5));
  }

  function decreaseZoom() {
    setZoom((value) => Math.max(value - 0.2, 0.5));
  }

  function resetZoom() {
    setZoom(1);
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 shadow-2xl">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
            <FileSearch size={20} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-100">
              Forensic Evidence Comparison
            </h3>
            <p className="text-xs text-slate-400">
              Side-by-side inspection of submitted document raster and synthetic anomaly localization
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono mr-1">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={decreaseZoom}
            aria-label="Zoom out"
            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-2 text-slate-300 transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            aria-label="Reset zoom"
            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-2 text-slate-300 transition-colors"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            onClick={increaseZoom}
            aria-label="Zoom in"
            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 p-2 text-slate-300 transition-colors"
          >
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Original Document */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <ImageIcon size={14} className="text-slate-400" />
              <span>Original Document View</span>
            </div>
            {authDocSrc && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-mono">
                Source Document
              </span>
            )}
          </div>

          <div className="relative min-h-[280px] max-h-[460px] overflow-auto rounded-lg border border-white/5 bg-black/60 p-2 flex items-center justify-center">
            {loadingDoc ? (
              <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span>Decrypting authentic document stream...</span>
              </div>
            ) : authDocSrc ? (
              <img
                src={authDocSrc}
                alt="Original document evidence"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  transition: "transform 0.15s ease-out",
                }}
                className="max-w-full rounded select-none shadow-md"
              />
            ) : (
              <div className="text-center p-6 text-slate-500 text-xs space-y-1">
                <ShieldAlert size={28} className="mx-auto text-slate-600 mb-1" />
                <p>Original raster unavailable or document was submitted as text-only payload.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Forensic Heatmap */}
        <div className="rounded-xl border border-white/10 bg-black/40 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-red-400">
              <ShieldAlert size={14} className="text-red-400" />
              <span>Forensic ELA / Tampering Localization</span>
            </div>
            {authHeatmapSrc && (
              <span className="text-[10px] px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-mono">
                Anomaly Map
              </span>
            )}
          </div>

          <div className="relative min-h-[280px] max-h-[460px] overflow-auto rounded-lg border border-white/5 bg-black/60 p-2 flex items-center justify-center">
            {loadingHeatmap ? (
              <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                <span>Synthesizing Error Level Analysis tensor...</span>
              </div>
            ) : authHeatmapSrc ? (
              <img
                src={authHeatmapSrc}
                alt="Generated forensic heatmap"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  transition: "transform 0.15s ease-out",
                }}
                className="max-w-full rounded select-none shadow-md"
              />
            ) : (
              <div className="text-center p-6 text-slate-500 text-xs space-y-1">
                <ShieldAlert size={28} className="mx-auto text-slate-600 mb-1" />
                <p>No high-frequency anomaly or compression discontinuity detected for this finding.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis Method & Details footer */}
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-slate-400">Analysis Method</span>
          <span className="font-mono text-slate-300">{method}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          {description}
        </p>
      </div>
    </div>
  );
}
