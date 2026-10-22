"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, QrCode, KeyRound, Building2, AlertTriangle, Clock } from "lucide-react";
import { fetchApplicationVerifications } from "@/lib/api";

export interface VerificationCheck {
  id: string;
  applicationId: string;
  documentId: string;
  method: "QR" | "SIGNATURE" | "ISSUER" | string;
  status: "VERIFIED" | "MISMATCH" | "EXPIRED" | "PENDING" | "SOURCE_UNAVAILABLE" | "MANUAL_REVIEW_REQUIRED" | string;
  source?: string;
  details?: any;
  verifiedAt: string;
}

interface Props {
  applicationId: string;
}

export function VerificationLadder({ applicationId }: Props) {
  const [checks, setChecks] = useState<VerificationCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchApplicationVerifications(applicationId);
        if (active) {
          setChecks(data ?? []);
        }
      } catch (err: any) {
        if (active) {
          setError(err?.message || "Failed to load verification ladder checks");
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

  function getMethodIcon(method: string) {
    switch (method.toUpperCase()) {
      case "QR":
        return <QrCode size={18} className="text-cyan-400" />;
      case "SIGNATURE":
        return <KeyRound size={18} className="text-emerald-400" />;
      case "ISSUER":
        return <Building2 size={18} className="text-amber-400" />;
      default:
        return <ShieldCheck size={18} className="text-red-400" />;
    }
  }

  function getStatusBadge(status: string) {
    const s = (status || "").toUpperCase();
    if (s === "VERIFIED") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          VERIFIED
        </span>
      );
    }
    if (s === "EXPIRED" || s === "MISMATCH") {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
          {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
        {s.replace(/_/g, " ")}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-400 space-y-2">
        <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs">Loading verification ladder checks...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/10 text-xs text-red-400 flex items-center gap-2">
        <AlertTriangle size={16} />
        <span>{error}</span>
      </div>
    );
  }

  if (checks.length === 0) {
    return (
      <div className="p-6 rounded-xl border border-white/10 bg-black/20 text-center text-xs text-slate-400">
        <ShieldCheck size={28} className="mx-auto text-slate-600 mb-1" />
        <p>No verification checks recorded for this application yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Automated Verification Ladder ({checks.length} Checks)
        </h4>
        <span className="text-[11px] text-slate-500 font-mono">Real-time Persistence</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((chk) => {
          let detailsObj: any = chk.details;
          if (typeof detailsObj === "string") {
            try {
              detailsObj = JSON.parse(detailsObj);
            } catch {
              detailsObj = {};
            }
          }

          return (
            <div
              key={chk.id}
              className="p-4 rounded-xl border border-white/10 bg-slate-900/60 backdrop-blur-md flex flex-col justify-between space-y-3 hover:border-white/20 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10">
                      {getMethodIcon(chk.method)}
                    </div>
                    <span className="font-semibold text-slate-200 text-xs uppercase tracking-wider">
                      {chk.method} Check
                    </span>
                  </div>
                  {getStatusBadge(chk.status)}
                </div>

                <div className="text-xs text-slate-400 space-y-1">
                  <p className="truncate">
                    <span className="text-slate-500">Source:</span>{" "}
                    <span className="text-slate-300 font-medium">{chk.source || "Regulatory Engine"}</span>
                  </p>
                  {detailsObj?.payload && (
                    <p className="text-[11px] font-mono text-slate-400 truncate">
                      Payload: {detailsObj.payload}
                    </p>
                  )}
                  {detailsObj?.message && (
                    <p className="text-[11px] text-slate-400 truncate">
                      {detailsObj.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1 font-mono">
                  <Clock size={11} />
                  {new Date(chk.verifiedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
                <span className="font-mono text-slate-500">Doc: {chk.documentId?.slice(0, 8)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
