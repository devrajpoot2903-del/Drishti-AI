export type ApplicationStatus =
  | "Submitted"
  | "Processing"
  | "Needs Review"
  | "Cleared"
  | "Failed";

export type FindingSeverity = "High" | "Medium" | "Low";

export interface EvidenceItem {
  documentName: string;
  pageNumber?: number;
  methodUsed: string;
  description: string;
  originalUrl?: string;
  heatmapUrl?: string;
  boundingBoxes?: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
  }[];
  confidence?: number;
}

export interface Finding {
  id: string;
  category: "Verification" | "Forensics" | "Compliance";
  severity: FindingSeverity;
  title: string;
  detail: string;
  tool?: string;
  supportingEvidence?: string;
  verificationStatus: "Verified" | "Discrepancy" | "Unverified";
  documentRef?: string;
  confidence?: number; // Only when the processing tool provides a meaningful score
  evidence?: EvidenceItem;
}

export interface ImpactMetrics {
  applicationsProcessed: number;
  averageProcessingTimeFormatted: string; // e.g. "—" or "1.4s"
  estimatedTimeSavedFormatted: string; // e.g. "—" or "2h 15m (estimated)"
  hasBaselineData: boolean;
  baselineManualMinutes?: number;
  baselineMethodology?: string;
  isBaselineConfigured?: boolean;
}

export interface DocumentItem {
  id: string;
  name: string;
  size: string;
  type: string;
  hash: string;
  uploadedAt: string;
  ocrStatus: "Not Processed" | "Running" | "Extracted" | "Failed";
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  appId: string;
  actor: string;
  action: string;
  hash: string;
  hashChainStatus: "Verified" | "Unverified" | "Pending";
}

export interface Application {
  id: string;
  institutionName: string;
  category: "Engineering & Tech" | "Management" | "Pharmacy" | "Architecture";
  approvalType: string;
  academicYear: string;
  submissionDate: string;
  submittedAt?: string;
  processedAt?: string;
  status: ApplicationStatus;
  assignedOfficial?: string;
  reviewedBy?: string;
  riskScore?: number;
  summary?: string;
  documents: DocumentItem[];
  findings: Finding[];
  history: AuditEvent[];
  reviewerNotes?: string;
  agentExecutions?: any[];
}

export type AgentExecutionStatus =
  | "Not Started"
  | "Running"
  | "Completed"
  | "Skipped"
  | "Failed"
  | "Needs Review";

export interface SubModuleExecution {
  name: string;
  engine: string;
  status: AgentExecutionStatus;
  findings?: string;
  reason?: string;
}

export interface AgentWorkflowStage {
  id: string;
  number: string;
  name: string;
  status: AgentExecutionStatus;
  description: string;
  duration?: string;
  reason?: string;
  subModules?: SubModuleExecution[];
}

export interface DashboardStats {
  totalApplications: number;
  processed: number;
  needsReview: number;
  totalApplicationsTrend?: string;
  processedApplicationsTrend?: string;
  needsReviewApplicationsTrend?: string;
}

