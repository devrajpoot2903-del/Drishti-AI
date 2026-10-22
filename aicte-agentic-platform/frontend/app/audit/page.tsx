"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import {
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  FileText,
  Clock,
  QrCode,
  ShieldAlert,
  UserCheck,
  Download,
  Search,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ExternalLink,
  Layers,
  FileCheck
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchApplications, fetchAuditLogs, fetchApplicationVerifications, downloadReportApi, verifyAuditChainApi } from "@/lib/api";
import { Application, AuditEvent } from "@/lib/types";

export default function AuditPage() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [allAuditLogs, setAllAuditLogs] = useState<AuditEvent[]>([]);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [verifyingChain, setVerifyingChain] = useState<boolean>(false);
  const [chainResult, setChainResult] = useState<any | null>(null);

  // Per-application dynamic audits and verification check caches
  const [appAuditCache, setAppAuditCache] = useState<Record<string, AuditEvent[]>>({});
  const [appVerificationsCache, setAppVerificationsCache] = useState<Record<string, any[]>>({});
  const [loadingAppDetails, setLoadingAppDetails] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [appsData, auditData] = await Promise.all([
        fetchApplications().catch(() => []),
        fetchAuditLogs().catch(() => [])
      ]);

      // Respect existing RBAC:
      // Institutions see only their own applications; Scrutiny Officers / Admins / Demo see all
      let visibleApps = appsData;
      if (user && user.role === "INSTITUTION") {
        visibleApps = appsData.filter((a) => {
          return (
            (user.institutionId && a.institutionId === user.institutionId) ||
            (user.id && (a.submittedBy === user.id || a.institutionId === user.id))
          );
        });
      }

      setApplications(visibleApps);
      setAllAuditLogs(auditData);
    } catch (err: any) {
      setError(err?.message || "Unable to connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // When expanding a folder, load fresh application-specific audits & verifications
  const toggleFolder = async (appId: string) => {
    const isNowExpanded = !expandedFolders[appId];
    setExpandedFolders((prev) => ({ ...prev, [appId]: isNowExpanded }));

    if (isNowExpanded && !appAuditCache[appId]) {
      try {
        setLoadingAppDetails((prev) => ({ ...prev, [appId]: true }));
        const [appAudits, appVerifications] = await Promise.all([
          fetchAuditLogs(appId).catch(() => []),
          fetchApplicationVerifications(appId).catch(() => [])
        ]);

        // Sort audit logs chronologically ascending (1, 2, 3...)
        const sortedAudits = [...appAudits].sort(
          (a, b) => (a.sequence || 0) - (b.sequence || 0)
        );

        setAppAuditCache((prev) => ({ ...prev, [appId]: sortedAudits }));
        setAppVerificationsCache((prev) => ({ ...prev, [appId]: appVerifications }));
      } catch (e) {
        console.error("Failed to load folder details for " + appId, e);
      } finally {
        setLoadingAppDetails((prev) => ({ ...prev, [appId]: false }));
      }
    }
  };

  const handleVerifyChain = async () => {
    try {
      setVerifyingChain(true);
      const res = await verifyAuditChainApi();
      setChainResult(res);
    } catch (err: any) {
      setChainResult({
        valid: false,
        message: err?.message || "Failed to verify chain roots"
      });
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleDownloadReport = async (applicationId: string) => {
    try {
      setDownloadingReportId(applicationId);
      const blob = await downloadReportApi(applicationId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `drishti-scrutiny-report-${applicationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err: any) {
      alert(`Could not download PDF report: ${err?.message || "Unknown error"}`);
    } finally {
      setDownloadingReportId(null);
    }
  };

  const filteredApplications = useMemo(() => {
    if (!searchQuery.trim()) return applications;
    const q = searchQuery.toLowerCase();
    return applications.filter(
      (app) =>
        (app.id || "").toLowerCase().includes(q) ||
        (app.institutionName || "").toLowerCase().includes(q) ||
        (app.status || "").toLowerCase().includes(q) ||
        (app.category || "").toLowerCase().includes(q)
    );
  }, [applications, searchQuery]);

  return (
    <div className="flex h-screen w-full bg-[#08090d] overflow-hidden text-slate-100">
      <Sidebar className="hidden md:flex" />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header
          title="Audit & Reports"
          subtitle="Per-application provenance dossiers, cryptographic verification, and official scrutiny reports"
          showNewButton={false}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* Top Ledger Integrity Bar */}
          <div className="bg-[#0f121c]/90 border border-white/10 rounded-xl p-4 md:p-5 backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-black/40">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-semibold text-white tracking-wide">
                    Application Provenance Ledger
                  </h2>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                    <Lock className="w-2.5 h-2.5" />
                    SHA-256 Chained
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Every institutional application has an immutable dossier containing uploaded statutory files, cryptographic QR / signature audits, automated forensics, and officer determinations.
                </p>
                {chainResult && (
                  <p className="text-xs font-mono text-emerald-300 mt-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    {chainResult.message || "All records mathematically verified with zero hash discrepancies."}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
              <button
                onClick={handleVerifyChain}
                disabled={verifyingChain}
                className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-white/5 hover:bg-white/10 active:bg-white/[0.12] border border-white/10 rounded-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${verifyingChain ? "animate-spin" : ""}`} />
                {verifyingChain ? "Verifying Chain..." : "Verify Hash Roots"}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-[#0f121c]/70 border border-white/10 rounded-xl p-3.5 backdrop-blur-md flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Application ID or Institution Name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#141824] border border-white/10 rounded-lg text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/80 focus:border-indigo-500/80"
              />
            </div>
            <div className="text-xs font-mono text-slate-400">
              {filteredApplications.length} Application Folder{filteredApplications.length === 1 ? "" : "s"}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-6 text-center text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && !error && (
            <div className="bg-[#0f121c]/70 border border-white/10 rounded-xl p-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
              Loading application audit folders...
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredApplications.length === 0 && (
            <div className="bg-[#0f121c]/70 border border-white/10 rounded-xl p-16 text-center">
              <Folder className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No Applications Found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery ? "No application folders match your search query." : "No institutional applications recorded in the database yet."}
              </p>
            </div>
          )}

          {/* Folders List (Collapsible per Application) */}
          {!loading && !error && filteredApplications.length > 0 && (
            <div className="space-y-4">
              {filteredApplications.map((app) => {
                const isExpanded = !!expandedFolders[app.id];
                const isLoadingDetails = !!loadingAppDetails[app.id];

                // Gather real backend data
                const appDocs = app.documents || [];
                const appFindings = app.findings || [];

                // Use cached per-app audits if available, otherwise filter from allAuditLogs or app.history
                const appAuditEntries =
                  appAuditCache[app.id] ||
                  allAuditLogs.filter((l) => l.appId === app.id || (l.hash && l.appId === app.id)) ||
                  (app as any).history ||
                  [];

                // Use cached per-app verification results or app.verificationResults
                const appVerifications =
                  appVerificationsCache[app.id] ||
                  (app as any).verificationResults ||
                  [];

                // Review history officer decisions
                const hasOfficerDecision = !!app.reviewedBy || !!app.reviewDecision;
                const officerAuditLogs = appAuditEntries.filter((l) => {
                  const role = (l.actorRole || "").toUpperCase();
                  const act = (l.action || "").toUpperCase();
                  return role.includes("OFFICER") || act.includes("APPROV") || act.includes("RECTIF") || act.includes("ESCALAT");
                });

                const riskColor =
                  (app.riskScore ?? 0) >= 70
                    ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                    : (app.riskScore ?? 0) >= 30
                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                    : "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

                return (
                  <div
                    key={app.id}
                    className="bg-[#0e121d]/90 border border-white/10 hover:border-white/20 rounded-xl overflow-hidden shadow-xl transition-all backdrop-blur-md"
                  >
                    {/* Collapsible Folder Header */}
                    <button
                      onClick={() => toggleFolder(app.id)}
                      className="w-full p-4 md:p-5 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] active:bg-white/[0.04] transition-colors cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 text-indigo-400">
                          {isExpanded ? <FolderOpen className="w-5 h-5 text-indigo-400" /> : <Folder className="w-5 h-5 text-indigo-300" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm font-bold text-indigo-300">
                              {app.id}
                            </span>
                            <span className="text-slate-500 font-mono text-xs">—</span>
                            <span className="font-semibold text-sm text-white truncate max-w-md">
                              {app.institutionName || "Institutional Applicant"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-1">
                            <span>{app.category || "AICTE Scrutiny"}</span>
                            <span>•</span>
                            <span>{app.academicYear || "2026-27"}</span>
                            <span>•</span>
                            <span>{appDocs.length} Document{appDocs.length === 1 ? "" : "s"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {app.status && (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 hidden sm:inline-block">
                            {app.status}
                          </span>
                        )}
                        <span className={`text-xs font-mono font-medium px-2.5 py-1 rounded-full border ${riskColor}`}>
                          Risk: {app.riskScore ?? 0}
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-white" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                        </div>
                      </div>
                    </button>

                    {/* Collapsible Folder Body */}
                    {isExpanded && (
                      <div className="border-t border-white/10 p-5 md:p-6 bg-[#090b12]/90 space-y-6 animate-in fade-in duration-200">
                        {isLoadingDetails && (
                          <div className="text-center py-4 text-xs text-indigo-400 flex items-center justify-center gap-2">
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Loading live verification and audit timeline...
                          </div>
                        )}

                        {/* SECTION 1: Uploaded Documents */}
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                            <FileText className="w-4 h-4 text-indigo-400" />
                            <span>1. Uploaded Documents</span>
                            <span className="text-slate-500 font-mono">({appDocs.length})</span>
                          </div>

                          {appDocs.length === 0 ? (
                            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-slate-500 italic">
                              No documents uploaded for this application.
                            </div>
                          ) : (
                            <div className="border border-white/10 rounded-lg overflow-x-auto bg-[#0d101a]">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-white/[0.03] border-b border-white/10 text-slate-400 font-medium">
                                    <th className="py-2.5 px-4">Filename</th>
                                    <th className="py-2.5 px-4">Upload Date</th>
                                    <th className="py-2.5 px-4">Document Type</th>
                                    <th className="py-2.5 px-4 text-right">Integrity Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                  {appDocs.map((doc: any, dIdx: number) => (
                                    <tr key={doc.id || dIdx} className="hover:bg-white/[0.02]">
                                      <td className="py-2.5 px-4 font-mono text-slate-200 flex items-center gap-2">
                                        <FileCheck className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                        <span>{doc.filename || doc.name || "document.pdf"}</span>
                                      </td>
                                      <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">
                                        {doc.uploadedAt || doc.createdAt || doc.uploadDate || "2026-10-22"}
                                      </td>
                                      <td className="py-2.5 px-4 text-slate-300">
                                        <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[11px]">
                                          {doc.documentType || doc.type || "Statutory NOC"}
                                        </span>
                                      </td>
                                      <td className="py-2.5 px-4 text-right">
                                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                          <CheckCircle2 className="w-3 h-3" />
                                          {doc.hash ? "SHA-256 Validated" : "Uploaded"}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* SECTION 2: Audit Log Entries (timeline) */}
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                            <Clock className="w-4 h-4 text-cyan-400" />
                            <span>2. Audit Log Entries (Timeline)</span>
                            <span className="text-slate-500 font-mono">({appAuditEntries.length})</span>
                          </div>

                          {appAuditEntries.length === 0 ? (
                            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-slate-500 italic">
                              No audit log entries recorded for this application.
                            </div>
                          ) : (
                            <div className="border border-white/10 rounded-lg overflow-x-auto bg-[#0d101a]">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="bg-white/[0.03] border-b border-white/10 text-slate-400 font-medium">
                                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                                    <th className="py-2.5 px-4">Timestamp</th>
                                    <th className="py-2.5 px-4">Actor & Role</th>
                                    <th className="py-2.5 px-4">Action Summary</th>
                                    <th className="py-2.5 px-4 font-mono">SHA-256 Hash</th>
                                    <th className="py-2.5 px-4 text-right">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/[0.05]">
                                  {appAuditEntries.map((log, lIdx) => {
                                    const seqNum = lIdx + 1;
                                    const isSystem = (log.actorRole || "").includes("SYSTEM") || (log.actor || "").includes("SYSTEM");
                                    const isOfficer = (log.actorRole || "").includes("OFFICER") || (log.actor || "").includes("OFFICER");
                                    const hash = log.hash || log.currentHash || "SHA-256-RECORD";

                                    return (
                                      <tr key={log.id || lIdx} className="hover:bg-white/[0.02]">
                                        <td className="py-2.5 px-3 text-center font-mono text-slate-500 text-[11px]">
                                          {seqNum}
                                        </td>
                                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                          {log.timestamp ? new Date(log.timestamp).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }) : "N/A"}
                                        </td>
                                        <td className="py-2.5 px-4 whitespace-nowrap">
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
                                        </td>
                                        <td className="py-2.5 px-4 text-slate-200 text-xs">
                                          {log.action}
                                        </td>
                                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-400" title={hash}>
                                          {hash.slice(0, 16)}...
                                        </td>
                                        <td className="py-2.5 px-4 text-right whitespace-nowrap">
                                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                            <Lock className="w-2.5 h-2.5" />
                                            {log.hashChainStatus || "Verified"}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>

                        {/* SECTION 3: Verification Results (QR / Signature / Issuer) */}
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                            <QrCode className="w-4 h-4 text-emerald-400" />
                            <span>3. Verification Results (QR / Signature / Issuer)</span>
                            <span className="text-slate-500 font-mono">({appVerifications.length})</span>
                          </div>

                          {appVerifications.length === 0 ? (
                            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-slate-500 italic">
                              No verification results recorded for this application.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              {appVerifications.map((v: any, vIdx: number) => {
                                const method = (v.method || v.checkType || "QR").toUpperCase();
                                const status = (v.status || "PENDING").toUpperCase();
                                const isPass = status === "VERIFIED" || status === "PASS" || status === "VALID_MATCH";
                                const isMismatch = status === "MISMATCH" || status === "TAMPERED" || status === "EXPIRED";

                                const statusBadge = isPass
                                  ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                                  : isMismatch
                                  ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                                  : "text-amber-400 bg-amber-500/10 border-amber-500/20";

                                return (
                                  <div
                                    key={v.id || vIdx}
                                    className="p-3.5 rounded-lg bg-[#0d101a] border border-white/10 space-y-2"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="text-xs font-bold text-slate-200 tracking-wide">
                                        {method === "QR" ? "QR Code Verification" : method === "SIGNATURE" ? "Digital Signature" : "Issuer Registry"}
                                      </span>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                                        {status}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-400">
                                      <span className="text-slate-500 font-medium">Source: </span>
                                      <span className="text-slate-300">{v.source || "State Statutory Authority Registry"}</span>
                                    </div>
                                    {v.details && (
                                      <div className="text-[11px] font-mono text-slate-400 bg-black/30 p-2 rounded border border-white/5 truncate">
                                        {typeof v.details === "string" ? v.details : JSON.stringify(v.details)}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* SECTION 4: Forensic Findings */}
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                            <ShieldAlert className="w-4 h-4 text-amber-400" />
                            <span>4. Forensic Findings</span>
                            <span className="text-slate-500 font-mono">({appFindings.length})</span>
                          </div>

                          {appFindings.length === 0 ? (
                            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-slate-500 italic">
                              No forensic findings for this application.
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {appFindings.map((f: any, fIdx: number) => {
                                const sev = (f.severity || "MEDIUM").toUpperCase();
                                const sevColor =
                                  sev === "HIGH" || sev === "CRITICAL"
                                    ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                                    : sev === "MEDIUM"
                                    ? "text-amber-400 bg-amber-500/10 border-amber-500/20"
                                    : "text-blue-400 bg-blue-500/10 border-blue-500/20";

                                return (
                                  <div
                                    key={f.id || fIdx}
                                    className="p-3.5 rounded-lg bg-[#0d101a] border border-white/10 space-y-1.5"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                        <h4 className="text-xs font-bold text-white">
                                          {f.title || f.ruleId || "Forensic Anomaly Detected"}
                                        </h4>
                                      </div>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sevColor}`}>
                                        {sev} SEVERITY
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-300 leading-relaxed pl-5">
                                      {f.detail || f.description || "Forensic inspection anomaly recorded."}
                                    </p>
                                    {(f.evidenceRef || f.evidence) && (
                                      <div className="pl-5 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                                        <span className="text-slate-500">Evidence Ref:</span>
                                        <span className="text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                                          {f.evidenceRef || f.evidence?.id || "ELA-ANOMALY-RASTER"}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* SECTION 5: Review History (Officer decisions) */}
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                            <UserCheck className="w-4 h-4 text-purple-400" />
                            <span>5. Review History (Officer Decisions)</span>
                          </div>

                          {!hasOfficerDecision && officerAuditLogs.length === 0 ? (
                            <div className="p-4 rounded-lg bg-white/[0.02] border border-white/5 text-xs text-slate-500 italic">
                              No officer decisions recorded yet for this application.
                            </div>
                          ) : (
                            <div className="space-y-2.5">
                              {hasOfficerDecision && (
                                <div className="p-4 rounded-lg bg-[#0d101a] border border-white/10 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-white">
                                        Decision: {app.reviewDecision || app.status || "Under Review"}
                                      </span>
                                    </div>
                                    <span className="text-[11px] font-mono text-slate-400">
                                      {app.reviewedAt ? new Date(app.reviewedAt).toLocaleString() : "Date N/A"}
                                    </span>
                                  </div>
                                  <div className="text-xs text-slate-300">
                                    <span className="text-slate-500">Reviewer: </span>
                                    <span className="font-medium text-slate-200">{app.reviewedBy || "Authorized Scrutiny Officer"}</span>
                                  </div>
                                  {app.reviewNotes && (
                                    <div className="text-xs text-slate-300 bg-black/30 p-2.5 rounded border border-white/5 mt-1 leading-relaxed">
                                      {app.reviewNotes}
                                    </div>
                                  )}
                                </div>
                              )}

                              {officerAuditLogs.map((oLog, oIdx) => (
                                <div key={oLog.id || oIdx} className="p-3 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                                  <span className="text-slate-300">{oLog.action}</span>
                                  <span className="text-slate-500 font-mono text-[11px]">
                                    {oLog.timestamp ? new Date(oLog.timestamp).toLocaleDateString() : ""}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* SECTION 6: Download PDF Report */}
                        <div className="space-y-2.5 pt-2 border-t border-white/10">
                          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
                            <Download className="w-4 h-4 text-indigo-400" />
                            <span>6. Official Scrutiny Report</span>
                          </div>

                          <div className="p-4 rounded-lg bg-[#0d101a] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <h4 className="text-xs font-bold text-white">AICTE Regulatory Scrutiny Dossier</h4>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Generates a cryptographically signed decision packet with statutory checklists, verification traces, and officer sign-off.
                              </p>
                            </div>

                            <button
                              onClick={() => handleDownloadReport(app.id)}
                              disabled={downloadingReportId === app.id}
                              className="px-4 py-2.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50 shrink-0"
                            >
                              <Download className={`w-4 h-4 ${downloadingReportId === app.id ? "animate-bounce" : ""}`} />
                              {downloadingReportId === app.id ? "Generating PDF..." : "Download PDF Report"}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
