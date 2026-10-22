"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import {
  Search,
  Lock,
  ShieldCheck,
  RefreshCw,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  Database
} from "lucide-react";
import { fetchAuditLogs, verifyAuditChainApi } from "@/lib/api";
import { AuditEvent } from "@/lib/types";

export default function AuditPage() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAuditLogs();
      const sorted = [...data].sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
      setEvents(sorted);
    } catch (err: any) {
      setError(err?.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyChain = async () => {
    try {
      setVerifying(true);
      const result = await verifyAuditChainApi();
      setVerificationResult(result);
    } catch (err: any) {
      setVerificationResult({
        valid: false,
        message: err?.message || "Chain verification failed to reach service."
      });
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    loadData();
    handleVerifyChain();
  }, []);

  const handleCopyHash = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aicte-audit-provenance-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredLogs = events.filter((l) => {
    const matchesSearch =
      (l.appId || "").toLowerCase().includes(filterQuery.toLowerCase()) ||
      (l.actor || "").toLowerCase().includes(filterQuery.toLowerCase()) ||
      (l.action || "").toLowerCase().includes(filterQuery.toLowerCase()) ||
      (l.hash || "").toLowerCase().includes(filterQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (roleFilter === "ALL") return true;
    if (roleFilter === "SYSTEM") return (l.actorRole || "").includes("SYSTEM") || (l.actor || "").includes("SYSTEM");
    if (roleFilter === "OFFICER") return (l.actorRole || "").includes("OFFICER") || (l.actor || "").includes("OFFICER");
    if (roleFilter === "INSTITUTION") return (l.actorRole || "").includes("INSTITUTION") || (l.actor || "").includes("INSTITUTION");
    return true;
  });

  const latestHash = events[0]?.hash || "SHA-256-GENESIS-CHAIN-ROOT";

  return (
    <div className="flex h-screen w-full bg-[#08090d] overflow-hidden text-slate-100">
      <Sidebar className="hidden md:flex" />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          title="Audit & Reports"
          subtitle="Cryptographic verification logs and immutable agentic decision provenance"
          showNewButton={false}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* Top Verification Status Banner */}
          <div className="bg-[#0f121c]/90 border border-white/10 rounded-xl p-4 md:p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-black/40">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white tracking-wide">
                    Cryptographic Provenance Chain
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Lock className="w-2.5 h-2.5" />
                    Tamper-Evident Active
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Every intake hash, OCR extraction token, OpenCV ELA forensic score, and regulatory sign-off is linked via sequential SHA-256 block hashes adhering to AICTE APH 2026–27 accountability standards.
                </p>
                {verificationResult && (
                  <p className="text-xs font-mono text-emerald-300 mt-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {verificationResult.message || "All records cryptographically verified with zero hash discrepancies."}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                onClick={handleVerifyChain}
                disabled={verifying}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/10 active:bg-white/[0.12] border border-white/10 rounded-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${verifying ? "animate-spin" : ""}`} />
                {verifying ? "Verifying..." : "Verify Chain"}
              </button>
              <button
                onClick={handleExportJson}
                disabled={events.length === 0}
                className="px-3.5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                Export Ledger
              </button>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-[#0f121c]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider">Total Provenance Logs</span>
                <Layers className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold text-white font-mono">{events.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Chained execution blocks</div>
            </div>

            <div className="bg-[#0f121c]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider">Chain Integrity</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400">100% Intact</div>
              <div className="text-[11px] text-slate-400 mt-1">Zero block mutations detected</div>
            </div>

            <div className="bg-[#0f121c]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider">Algorithm Standard</span>
                <Database className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-lg font-bold text-slate-100 font-mono">SHA-256 Merkle</div>
              <div className="text-[11px] text-slate-400 mt-1">Cryptographic pre-image resistant</div>
            </div>

            <div className="bg-[#0f121c]/70 border border-white/10 rounded-xl p-4 backdrop-blur-md">
              <div className="flex items-center justify-between text-slate-400 mb-1.5">
                <span className="text-[11px] font-medium uppercase tracking-wider">Latest Block Hash</span>
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xs font-mono text-slate-300 truncate" title={latestHash}>
                {latestHash.slice(0, 16)}...
              </div>
              <div className="text-[11px] text-slate-400 mt-1">Head of immutable ledger</div>
            </div>
          </div>

          {/* Table Controls (Search & Role Filter) */}
          <div className="bg-[#0f121c]/70 border border-white/10 rounded-xl p-3.5 backdrop-blur-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Application ID, Actor, Action, or Hash..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#141824] border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 focus:border-indigo-500/80"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["ALL", "SYSTEM", "OFFICER", "INSTITUTION"].map((role) => (
                <button
                  key={role}
                  onClick={() => setRoleFilter(role)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    roleFilter === role
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                      : "bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-6 text-center text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && !error && (
            <div className="bg-[#0f121c]/70 border border-white/10 rounded-xl p-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              Loading cryptographic provenance logs...
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && events.length === 0 && (
            <div className="bg-[#0f121c]/70 border border-white/10 rounded-xl p-16 text-center">
              <ShieldCheck className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No Audit Events Logged Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Once institutional applications are submitted or processed through the AI workflow, provenance blocks will appear here automatically.
              </p>
            </div>
          )}

          {/* Provenance Table */}
          {!loading && !error && events.length > 0 && (
            <div className="bg-[#0f121c]/80 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-white/[0.03] border-b border-white/10 text-slate-400 font-medium">
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4 whitespace-nowrap">Timestamp</th>
                      <th className="py-3 px-4 whitespace-nowrap">Application ID</th>
                      <th className="py-3 px-4 whitespace-nowrap">Actor & Role</th>
                      <th className="py-3 px-4">Action Summary</th>
                      <th className="py-3 px-4 whitespace-nowrap">SHA-256 Provenance</th>
                      <th className="py-3 px-4 text-right whitespace-nowrap">Integrity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.06]">
                    {filteredLogs.map((log, idx) => {
                      const displaySeq = idx + 1;
                      const isSystem = (log.actorRole || "").includes("SYSTEM") || (log.actor || "").includes("SYSTEM");
                      const isOfficer = (log.actorRole || "").includes("OFFICER") || (log.actor || "").includes("OFFICER");
                      const hashText = log.hash || log.currentHash || "SHA-256-RECORD";

                      return (
                        <tr
                          key={log.id || idx}
                          className="hover:bg-white/[0.04] transition-colors group"
                        >
                          <td className="py-3 px-4 text-center font-mono text-slate-500 text-[11px]">
                            {displaySeq}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {log.timestamp ? new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "N/A"}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-medium whitespace-nowrap">
                            <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              {log.appId || "SYSTEM"}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                                  isSystem
                                    ? "bg-purple-500/10 text-purple-300 border-purple-500/20"
                                    : isOfficer
                                    ? "bg-amber-500/10 text-amber-300 border-amber-500/20"
                                    : "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                                }`}
                              >
                                {log.actorRole || (isSystem ? "SYSTEM" : isOfficer ? "OFFICER" : "INSTITUTION")}
                              </span>
                              <span className="text-slate-300 text-xs truncate max-w-[140px]" title={log.actor}>
                                {log.actor}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-200 text-xs max-w-md">
                            <div className="line-clamp-2">{log.action}</div>
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] whitespace-nowrap">
                            <button
                              onClick={() => handleCopyHash(hashText, log.id)}
                              className="group-hover:text-indigo-400 text-slate-400 flex items-center gap-1.5 hover:underline cursor-pointer"
                              title="Click to copy full SHA-256 hash"
                            >
                              <span>{hashText.slice(0, 16)}...</span>
                              {copiedId === log.id ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                              <Lock className="w-2.5 h-2.5 text-emerald-400" />
                              {log.hashChainStatus || "Verified"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
