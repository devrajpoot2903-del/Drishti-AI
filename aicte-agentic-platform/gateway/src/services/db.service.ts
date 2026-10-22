import fs from "fs";
import path from "path";
import crypto from "crypto";

const DATA_DIR = path.resolve(__dirname, "../../../data");
const DB_FILE = path.join(DATA_DIR, "db.json");

export interface DatabaseState {
  users: any[];
  institutions: any[];
  applications: any[];
  documents: any[];
  findings: any[];
  evidence: any[];
  verificationResults: any[];
  auditLogs: any[];
  jobs: any[];
  config: {
    baselineManualMinutes: number;
    baselineMethodology: string;
  };
}

function loadLocalDb(): DatabaseState {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const defaultState: DatabaseState = {
    users: [],
    institutions: [],
    applications: [],
    documents: [],
    findings: [],
    evidence: [],
    verificationResults: [],
    auditLogs: [],
    jobs: [],
    config: {
      baselineManualMinutes: 120,
      baselineMethodology: "Standard AICTE manual scrutiny assumption: 120 minutes per institutional pack based on multi-member verification panel guidelines."
    }
  };

  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultState, null, 2), "utf-8");
    return defaultState;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(raw);
    return { ...defaultState, ...data };
  } catch (err) {
    return defaultState;
  }
}

function saveLocalDb(data: DatabaseState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save local database:", err);
  }
}

export const db = {
  getState: loadLocalDb,
  saveState: saveLocalDb,

  // Users
  findUserByEmail: (email: string) => {
    const state = loadLocalDb();
    return state.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserById: (id: string) => {
    const state = loadLocalDb();
    return state.users.find((u) => u.id === id);
  },
  createUser: (user: any) => {
    const state = loadLocalDb();
    const newUser = { ...user, id: user.id || crypto.randomUUID(), createdAt: new Date().toISOString() };
    state.users.push(newUser);
    saveLocalDb(state);
    return newUser;
  },

  // Applications
  findApplications: (filter?: any) => {
    const state = loadLocalDb();
    let apps = state.applications;
    if (filter?.status) {
      apps = apps.filter((a) => a.status === filter.status);
    }
    return apps;
  },
  findApplicationById: (id: string) => {
    const state = loadLocalDb();
    const app = state.applications.find((a) => a.id === id);
    if (!app) return null;
    return {
      ...app,
      documents: state.documents.filter((d) => d.applicationId === id),
      findings: state.findings.filter((f) => f.applicationId === id).map((f) => ({
        ...f,
        evidence: state.evidence.find((e) => e.findingId === f.id) || null
      })),
      history: state.auditLogs.filter((a) => a.appId === id)
    };
  },
  createApplication: (app: any) => {
    const state = loadLocalDb();
    state.applications.unshift(app);
    saveLocalDb(state);
    return app;
  },
  updateApplication: (id: string, updates: any) => {
    const state = loadLocalDb();
    const idx = state.applications.findIndex((a) => a.id === id);
    if (idx === -1) return null;
    state.applications[idx] = { ...state.applications[idx], ...updates, updatedAt: new Date().toISOString() };
    saveLocalDb(state);
    return state.applications[idx];
  },

  // Documents
  createDocument: (doc: any) => {
    const state = loadLocalDb();
    const newDoc = {
      ...doc,
      id: doc.id || crypto.randomUUID(),
      uploadedAt: new Date().toISOString(),
      revision: doc.revision ?? 1,
      replacesId: doc.replacesId ?? null,
      isCurrent: doc.isCurrent ?? true,
      extractedText: doc.extractedText ?? "",
      extractedFields: doc.extractedFields ?? []
    };
    state.documents.push(newDoc);
    saveLocalDb(state);
    return newDoc;
  },
  findDocumentById: (id: string) => {
    const state = loadLocalDb();
    return state.documents.find((d) => d.id === id);
  },
  findDocumentsByApplicationId: (appId: string) => {
    const state = loadLocalDb();
    return state.documents.filter((d) => d.applicationId === appId);
  },
  updateDocument: (id: string, updates: any) => {
    const state = loadLocalDb();
    const idx = state.documents.findIndex((d) => d.id === id);
    if (idx === -1) return null;
    state.documents[idx] = { ...state.documents[idx], ...updates };
    saveLocalDb(state);
    return state.documents[idx];
  },
  replaceDocumentVersion: (appId: string, prevDocId: string, newDocId: string) => {
    const state = loadLocalDb();
    const prevIdx = state.documents.findIndex((d) => d.id === prevDocId && d.applicationId === appId);
    const newIdx = state.documents.findIndex((d) => d.id === newDocId && d.applicationId === appId);
    if (prevIdx === -1 || newIdx === -1) return null;

    const previousDoc = state.documents[prevIdx];
    const newRevision = (previousDoc.revision || 1) + 1;

    state.documents[prevIdx] = {
      ...previousDoc,
      isCurrent: false
    };

    state.documents[newIdx] = {
      ...state.documents[newIdx],
      revision: newRevision,
      replacesId: previousDoc.id,
      isCurrent: true
    };

    saveLocalDb(state);
    return {
      previousDocument: state.documents[prevIdx],
      newDocument: state.documents[newIdx]
    };
  },

  // Verification Results
  createVerificationResult: (result: any) => {
    const state = loadLocalDb();
    const record = {
      id: result.id || crypto.randomUUID(),
      applicationId: result.applicationId,
      documentId: result.documentId,
      method: result.method || result.checkType || "QR",
      checkType: result.method || result.checkType || "QR",
      status: result.status,
      source: result.source || result.issuerReference || null,
      issuerReference: result.source || result.issuerReference || null,
      details: result.details || {},
      verifiedAt: result.verifiedAt || new Date().toISOString()
    };
    state.verificationResults = state.verificationResults || [];
    state.verificationResults.push(record);
    saveLocalDb(state);
    return record;
  },
  findVerificationResultsByApplicationId: (appId: string) => {
    const state = loadLocalDb();
    return (state.verificationResults || []).filter((r) => r.applicationId === appId);
  },

  // Findings & Evidence
  createFinding: (finding: any, evidence?: any) => {
    const state = loadLocalDb();
    const fid = finding.id || crypto.randomUUID();
    const newFinding = { ...finding, id: fid, createdAt: new Date().toISOString() };
    state.findings.push(newFinding);
    if (evidence) {
      const newEvidence = { ...evidence, id: crypto.randomUUID(), findingId: fid, createdAt: new Date().toISOString() };
      state.evidence.push(newEvidence);
      newFinding.evidence = newEvidence;
    }
    saveLocalDb(state);
    return newFinding;
  },
  findFindingById: (id: string) => {
    const state = loadLocalDb();
    const f = state.findings.find((item) => item.id === id);
    if (!f) return null;
    return {
      ...f,
      evidence: state.evidence.find((e) => e.findingId === f.id) || null
    };
  },

  // Audit Logs (Hash Chained)
  getAuditLogs: () => {
    const state = loadLocalDb();
    return state.auditLogs.sort((a, b) => b.sequence - a.sequence);
  },
  addAuditLog: (entry: any) => {
    const state = loadLocalDb();
    const sequence = state.auditLogs.length + 1;
    const previousHash = state.auditLogs.length > 0
      ? state.auditLogs[state.auditLogs.length - 1].currentHash
      : "0000000000000000000000000000000000000000000000000000000000000000";

    const timestamp = new Date().toISOString();
    const serialized = `${sequence}:${timestamp}:${entry.actorId}:${entry.actorRole}:${entry.action}:${entry.resourceRef || ""}:${previousHash}`;
    const currentHash = crypto.createHash("sha256").update(serialized).digest("hex");

    const record = {
      id: crypto.randomUUID(),
      sequence,
      timestamp,
      appId: entry.appId || null,
      actorId: entry.actorId,
      actorRole: entry.actorRole,
      action: entry.action,
      resourceRef: entry.resourceRef || null,
      previousHash,
      currentHash,
      hashChainStatus: "Verified"
    };

    state.auditLogs.push(record);
    saveLocalDb(state);
    return record;
  },

  // Config
  getConfig: () => {
    const state = loadLocalDb();
    return state.config;
  },
  updateConfig: (updates: any) => {
    const state = loadLocalDb();
    state.config = { ...state.config, ...updates };
    saveLocalDb(state);
    return state.config;
  }
};
