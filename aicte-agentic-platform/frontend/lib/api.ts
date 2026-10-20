import {
  Application,
  AuditEvent,
  DashboardStats,
  AgentWorkflowStage,
  ImpactMetrics,
  Finding,
  EvidenceItem
} from "./types";
import { getStoredToken } from "./auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

function getAuthHeaders(): HeadersInit {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errorDetail = "";
    try {
      const errJson = await res.json();
      errorDetail = errJson.error || errJson.message || errJson.detail;
    } catch {
      errorDetail = await res.text().catch(() => "");
    }
    throw new Error(errorDetail || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export async function loginApi(email: string, password: string): Promise<{ token: string; user: any }> {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  return handleResponse(res);
}

export async function fetchCurrentUserApi(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: getAuthHeaders(),
    cache: "no-store"
  });
  return handleResponse(res);
}

export async function fetchStats(): Promise<DashboardStats> {
  const apps = await fetchApplications();
  const total = apps.length;
  const processed = apps.filter((a) =>
    ["Needs Review", "Approved", "Rectification Requested", "Escalated"].includes(a.status)
  ).length;
  const needsReview = apps.filter((a) => a.status === "Needs Review").length;

  return {
    totalApplications: total,
    processed: processed,
    needsReview: needsReview,
    totalApplicationsTrend: "+0%",
    processedApplicationsTrend: "+0%",
    needsReviewApplicationsTrend: "+0%"
  };
}

function normalizeFinding(f: any): Finding {
  const sevRaw = (f.severity || "Low").toLowerCase();
  const severity: "High" | "Medium" | "Low" = 
    sevRaw.includes("crit") || sevRaw.includes("high") ? "High" : 
    sevRaw.includes("warn") || sevRaw.includes("med") ? "Medium" : "Low";
  
  let evidence = f.evidence;
  if (evidence) {
    evidence = {
      ...evidence,
      documentName: evidence.documentName || evidence.documentRef || "Document",
      pageNumber: evidence.pageNumber ?? evidence.page,
      methodUsed: evidence.methodUsed || f.methodUsed || "Automated Analysis",
      description: evidence.description || f.description || f.detail || "",
      heatmapUrl: evidence.heatmapUrl || evidence.imageUrl,
      originalUrl: evidence.originalUrl,
      boundingBoxes: evidence.boundingBoxes || [],
      confidence: evidence.confidence ?? f.confidence
    };
  }

  return {
    id: f.id,
    category: f.category || "Forensics",
    severity,
    title: f.title,
    detail: f.detail || f.description || "",
    tool: f.tool || f.methodUsed,
    supportingEvidence: f.supportingEvidence || (evidence ? `${evidence.methodUsed} on ${evidence.documentName}` : undefined),
    verificationStatus: f.verificationStatus || (severity === "High" ? "Discrepancy" : "Verified"),
    documentRef: f.documentRef || (evidence ? evidence.documentName : undefined),
    confidence: f.confidence,
    evidence
  };
}

export async function fetchApplications(): Promise<Application[]> {
  const res = await fetch(`${BASE_URL}/api/applications`, {
    headers: getAuthHeaders(),
    cache: "no-store"
  });
  const data = await handleResponse<any[]>(res);
  
  // Normalize fields to frontend Application type
  return data.map((item) => ({
    id: item.id,
    institutionName: item.institutionName,
    category: item.category || "Engineering & Tech",
    approvalType: item.approvalType || "Extension of Approval (EOA)",
    academicYear: item.academicYear || "2026-27",
    status: item.status,
    submissionDate: item.submittedAt ? item.submittedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    submittedAt: item.submittedAt || new Date().toISOString(),
    processedAt: item.processedAt,
    reviewedBy: item.reviewedBy,
    reviewerNotes: item.reviewNotes,
    riskScore: item.riskScore ?? 0.0,
    documents: item.documents || [],
    findings: (item.findings || []).map(normalizeFinding),
    history: item.history || [],
    agentExecutions: item.agentExecutions || []
  }));
}

export async function fetchApplicationById(id: string): Promise<Application | null> {
  const res = await fetch(`${BASE_URL}/api/applications/${id}`, {
    headers: getAuthHeaders(),
    cache: "no-store"
  });
  const item = await handleResponse<any>(res);
  if (!item) return null;

  return {
    id: item.id,
    institutionName: item.institutionName,
    category: item.category || "Engineering & Tech",
    approvalType: item.approvalType || "Extension of Approval (EOA)",
    academicYear: item.academicYear || "2026-27",
    status: item.status,
    submissionDate: item.submittedAt ? item.submittedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    submittedAt: item.submittedAt,
    processedAt: item.processedAt,
    reviewedBy: item.reviewedBy,
    reviewerNotes: item.reviewNotes,
    riskScore: item.riskScore ?? 0.0,
    documents: item.documents || [],
    findings: (item.findings || []).map(normalizeFinding),
    history: item.history || [],
    agentExecutions: item.agentExecutions || []
  };
}


export async function submitApplication(data: {
  institutionName: string;
  category: string;
  program?: string;
  approvalType?: string;
  academicYear?: string;
}): Promise<Application> {
  const res = await fetch(`${BASE_URL}/api/applications`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({
      institutionName: data.institutionName,
      category: data.category,
      program: data.program || data.category,
      academicYear: data.academicYear || "2026-27"
    })
  });
  return handleResponse<Application>(res);
}

export async function queueApplicationForProcessing(applicationId: string): Promise<{ jobId: string; status: string }> {
  const res = await fetch(`${BASE_URL}/api/applications/${applicationId}/process`, {
    method: "POST",
    headers: getAuthHeaders()
  });
  return handleResponse(res);
}

export async function uploadApplicationDocument(
  applicationId: string,
  file: File,
  documentType: string
): Promise<any> {
  const formData = new FormData();
  formData.append("applicationId", applicationId);
  formData.append("documentType", documentType);
  formData.append("file", file);

  const token = getStoredToken();
  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: "POST",
    headers,
    body: formData
  });
  return handleResponse(res);
}

export async function approveApplicationApi(id: string, notes?: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/applications/${id}/approve`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ notes: notes || "Application meets all verified regulatory norms." })
  });
  return handleResponse(res);
}

export async function rectifyApplicationApi(id: string, reason: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/applications/${id}/rectification`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ notes: reason })
  });
  return handleResponse(res);
}

export async function escalateApplicationApi(id: string, reason: string): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/applications/${id}/escalate`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ notes: reason })
  });
  return handleResponse(res);
}

export async function fetchImpactMetrics(): Promise<ImpactMetrics> {
  const res = await fetch(`${BASE_URL}/api/analytics/impact`, {
    headers: getAuthHeaders(),
    cache: "no-store"
  });
  const data = await handleResponse<any>(res);
  return {
    applicationsProcessed: data.processedCount || 0,
    averageProcessingTimeFormatted: data.averageProcessingDisplay || "—",
    estimatedTimeSavedFormatted: data.estimatedManualTimeSavedDisplay || "—",
    hasBaselineData: data.hasSufficientData ?? false,
    isBaselineConfigured: data.isBaselineConfigured,
    baselineManualMinutes: data.baselineManualMinutes,
    baselineMethodology: data.baselineMethodology
  };
}


export async function fetchFindingEvidence(findingId: string): Promise<EvidenceItem | null> {
  const res = await fetch(`${BASE_URL}/api/findings/${findingId}/evidence`, {
    headers: getAuthHeaders(),
    cache: "no-store"
  });
  const data = await handleResponse<any>(res);
  if (!data.hasEvidence || !data.evidence) {
    return null;
  }
  return data.evidence;
}

export async function fetchWorkflow(appId?: string): Promise<AgentWorkflowStage[]> {
  const url = appId ? `${BASE_URL}/api/workflow/agents?appId=${appId}` : `${BASE_URL}/api/workflow/agents`;
  const res = await fetch(url, { headers: getAuthHeaders(), cache: "no-store" });
  const data = await handleResponse<any>(res);
  return data.executions || [];
}

export async function fetchAuditLogs(): Promise<AuditEvent[]> {
  const res = await fetch(`${BASE_URL}/api/audit`, {
    headers: getAuthHeaders(),
    cache: "no-store"
  });
  return handleResponse<AuditEvent[]>(res);
}

export async function verifyAuditChainApi(): Promise<any> {
  const res = await fetch(`${BASE_URL}/api/audit/verify`, {
    headers: getAuthHeaders(),
    cache: "no-store"
  });
  return handleResponse(res);
}
