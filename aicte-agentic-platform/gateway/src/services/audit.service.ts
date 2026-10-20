import crypto from "crypto";
import { db } from "./db.service";

export interface AuditVerificationResult {
  valid: boolean;
  totalRecords: number;
  verifiedCount: number;
  tamperedSequence: number | null;
  status: "VERIFIED" | "COMPROMISED" | "EMPTY";
  message: string;
}

export class AuditService {
  public static log(entry: {
    actorId: string;
    actorRole: string;
    action: string;
    resourceRef?: string;
    appId?: string;
  }) {
    return db.addAuditLog(entry);
  }

  public static getLogs() {
    return db.getAuditLogs();
  }

  public static verifyChain(): AuditVerificationResult {
    const rawLogs = db.getAuditLogs(); // Note: getAuditLogs returns sorted descending by sequence
    // Sort ascending by sequence for verification
    const logs = [...rawLogs].sort((a, b) => a.sequence - b.sequence);

    if (logs.length === 0) {
      return {
        valid: true,
        totalRecords: 0,
        verifiedCount: 0,
        tamperedSequence: null,
        status: "EMPTY",
        message: "Audit ledger is currently empty. No records to verify."
      };
    }

    let expectedPrevHash = "0000000000000000000000000000000000000000000000000000000000000000";

    for (let i = 0; i < logs.length; i++) {
      const record = logs[i];

      // 1. Verify sequence order
      if (record.sequence !== i + 1) {
        return {
          valid: false,
          totalRecords: logs.length,
          verifiedCount: i,
          tamperedSequence: record.sequence,
          status: "COMPROMISED",
          message: `Sequence gap detected at record index ${i}: expected sequence ${i + 1}, found ${record.sequence}`
        };
      }

      // 2. Verify previousHash pointer
      if (record.previousHash !== expectedPrevHash) {
        return {
          valid: false,
          totalRecords: logs.length,
          verifiedCount: i,
          tamperedSequence: record.sequence,
          status: "COMPROMISED",
          message: `Hash link broken at sequence #${record.sequence}. Recorded previousHash does not match predecessor hash.`
        };
      }

      // 3. Recompute current hash deterministically
      const serialized = `${record.sequence}:${record.timestamp}:${record.actorId}:${record.actorRole}:${record.action}:${record.resourceRef || ""}:${record.previousHash}`;
      const recomputedHash = crypto.createHash("sha256").update(serialized).digest("hex");

      if (record.currentHash !== recomputedHash) {
        return {
          valid: false,
          totalRecords: logs.length,
          verifiedCount: i,
          tamperedSequence: record.sequence,
          status: "COMPROMISED",
          message: `Hash mismatch at sequence #${record.sequence}. The record payload has been tampered with or modified post-signing.`
        };
      }

      expectedPrevHash = record.currentHash;
    }

    return {
      valid: true,
      totalRecords: logs.length,
      verifiedCount: logs.length,
      tamperedSequence: null,
      status: "VERIFIED",
      message: `Tamper-evident verification successful: All ${logs.length} audit records mathematically verified via SHA-256 chain roots.`
    };
  }
}
