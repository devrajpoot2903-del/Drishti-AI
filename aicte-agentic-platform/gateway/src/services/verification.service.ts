import { prisma, isPrismaConnected } from "./prisma.service";
import { db } from "./db.service";

export interface VerificationInput {
  applicationId: string;
  documentId: string;
  method: "QR" | "SIGNATURE" | "ISSUER";
  status:
    | "VERIFIED"
    | "MISMATCH"
    | "EXPIRED"
    | "PENDING"
    | "SOURCE_UNAVAILABLE"
    | "MANUAL_REVIEW_REQUIRED";
  source?: string;
  details?: Record<string, unknown>;
}

export async function saveVerificationResult(input: VerificationInput) {
  // Always save to unified in-memory / JSON store
  const savedLocal = db.createVerificationResult(input);

  // If Prisma/PostgreSQL is connected, persist to relational model
  if (await isPrismaConnected()) {
    try {
      return await prisma.verificationResult.create({
        data: {
          applicationId: input.applicationId,
          documentId: input.documentId,
          checkType: input.method,
          method: input.method,
          status: input.status,
          source: input.source,
          issuerReference: input.source,
          details: JSON.stringify(input.details ?? {}),
        },
      });
    } catch (err) {
      console.warn("[VerificationService] Relational write deferred, preserved in unified store:", err);
    }
  }

  return savedLocal;
}

export async function getVerificationResults(applicationId: string) {
  if (await isPrismaConnected()) {
    try {
      const results = await prisma.verificationResult.findMany({
        where: { applicationId },
        orderBy: { verifiedAt: "desc" },
      });
      if (results && results.length > 0) {
        return results;
      }
    } catch {
      // fallback
    }
  }

  return db.findVerificationResultsByApplicationId(applicationId);
}
