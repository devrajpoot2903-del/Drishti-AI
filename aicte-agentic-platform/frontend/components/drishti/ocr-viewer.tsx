"use client";

import { useEffect, useState } from "react";
import { FileText, AlertCircle, Copy, Check, Search, Sparkles } from "lucide-react";
import { fetchApplicationOCR } from "@/lib/api";

export interface ExtractedField {
  id: string;
  name: string;
  value: string;
  confidence?: number | null;
  pageNumber?: number | null;
}

export interface OCRResult {
  documentId: string;
  documentName: string;
  extractedText: string;
  fields: ExtractedField[];
  status: string;
}

interface Props {
  applicationId: string;
}

export function OCRViewer({ applicationId }: Props) {
  const [results, setResults] = useState<OCRResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        // Call helper from lib/api which handles auth and baseUrl
        const data = await fetchApplicationOCR(applicationId);
        if (active) {
          setResults(data ?? []);
        }
      } catch (err: any) {
        // Fallback to relative fetch
        try {
          const res = await fetch(`/api/applications/${applicationId}/ocr`, { cache: "no-store" });
          if (!res.ok) throw new Error("Unable to retrieve OCR results");
          const json = await res.json();
          if (active) {
            setResults(json.results ?? []);
          }
        } catch {
          if (active) {
            setError(err?.message || "OCR results could not be loaded.");
          }
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    if (applicationId) {
      load();
    }

    return () => {
      active = false;
    };
  }, [applicationId]);

  function handleCopy(docId: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(docId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
        <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium">Extracting OCR text and structured fields with PaddleOCR...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 flex items-center gap-3 text-red-400">
        <AlertCircle size={18} className="shrink-0" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="p-8 rounded-xl border border-white/10 bg-black/20 text-center text-slate-400">
        <FileText size={32} className="mx-auto text-slate-500 mb-2" />
        <p className="text-sm font-medium">Document extraction has not been completed.</p>
        <p className="text-xs text-slate-500 mt-1">Upload files or run scrutiny pipeline to generate OCR text.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="text-red-400" size={18} />
          <h3 className="text-sm font-semibold tracking-wide uppercase text-slate-200">
            PaddleOCR Extracted Content ({results.length} Documents)
          </h3>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search text or fields..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-white/10 bg-black/40 text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-red-500/50"
          />
        </div>
      </div>

      {results.map((result) => {
        const query = searchQuery.toLowerCase();
        const matchesQuery =
          !query ||
          result.documentName.toLowerCase().includes(query) ||
          result.extractedText.toLowerCase().includes(query) ||
          result.fields.some((f) => f.name.toLowerCase().includes(query) || f.value.toLowerCase().includes(query));

        if (!matchesQuery) return null;

        return (
          <div
            key={result.documentId}
            className="rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl p-6 shadow-xl"
          >
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-100 text-base">{result.documentName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {result.status || "EXTRACTED"}
                    </span>
                    <span className="text-xs text-slate-400">
                      {result.fields.length} structured {result.fields.length === 1 ? "field" : "fields"}
                    </span>
                  </div>
                </div>
              </div>

              {result.extractedText && (
                <button
                  type="button"
                  onClick={() => handleCopy(result.documentId, result.extractedText)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 transition-colors"
                >
                  {copiedId === result.documentId ? (
                    <>
                      <Check size={13} className="text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      <span>Copy Text</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Extracted Raw Text
                </h5>
                <div className="max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-black/40 p-4 font-mono text-xs leading-relaxed text-slate-300 select-text">
                  <pre className="whitespace-pre-wrap break-words font-sans">
                    {result.extractedText || "No text extracted from this document."}
                  </pre>
                </div>
              </div>

              <div>
                <h5 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Structured Regulatory Fields
                </h5>
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {result.fields.map((field) => (
                    <div
                      key={field.id}
                      className="rounded-xl border border-white/10 bg-white/5 p-3 hover:border-white/20 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-medium text-slate-300">{field.name}</span>
                        {field.confidence != null && (
                          <span className="text-[11px] text-emerald-400 font-mono">
                            {(field.confidence > 1 ? field.confidence : field.confidence * 100).toFixed(1)}% match
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm font-medium text-slate-100 break-words">{field.value}</p>
                    </div>
                  ))}

                  {result.fields.length === 0 && (
                    <p className="text-xs text-slate-500 italic p-3 border border-white/5 rounded-xl bg-white/[0.02]">
                      No tabular or key-value fields detected by PaddleOCR parser.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
