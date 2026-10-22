import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateRequest } from "../middleware/auth";
import { db } from "../services/db.service";
import { prisma, isPrismaConnected } from "../services/prisma.service";
import { AuditService } from "../services/audit.service";
import { QueueService } from "../services/queue.service";

export async function resubmissionRoutes(app: FastifyInstance) {
  app.post<{
    Params: { id: string };
    Body: {
      previousDocumentId: string;
      newDocumentId: string;
    };
  }>(
    "/api/applications/:id/resubmit",
    {
      preHandler: [authenticateRequest],
    },
    async (
      request: FastifyRequest<{
        Params: { id: string };
        Body: { previousDocumentId: string; newDocumentId: string };
      }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const { previousDocumentId, newDocumentId } = request.body || {};
      const user = request.user!;

      if (!previousDocumentId || !newDocumentId) {
        return reply.code(400).send({
          error: "Missing required fields: previousDocumentId and newDocumentId",
        });
      }

      // 1. Resolve application
      let application: any = null;
      if (await isPrismaConnected()) {
        try {
          application = await prisma.application.findUnique({
            where: { id },
          });
        } catch {
          // fallback
        }
      }

      if (!application) {
        application = db.findApplicationById(id);
      }

      if (!application) {
        return reply.code(404).send({
          error: `Application ${id} not found`,
        });
      }

      // 2. Institution ownership authorization
      if (user.role === "INSTITUTION") {
        const belongsToUser =
          application.institutionId === user.institutionId ||
          application.institutionId === user.id ||
          application.submittedBy === user.id;

        if (!belongsToUser) {
          return reply.code(403).send({
            error: "Forbidden: You are not authorized to resubmit documents for this institution dossier.",
          });
        }
      }

      // 3. Verify previous and replacement documents
      const prevDoc = db.findDocumentById(previousDocumentId);
      const newDoc = db.findDocumentById(newDocumentId);

      if (!prevDoc || prevDoc.applicationId !== id) {
        return reply.code(400).send({
          error: `Previous document ${previousDocumentId} does not belong to application ${id}`,
        });
      }

      if (!newDoc || newDoc.applicationId !== id) {
        return reply.code(400).send({
          error: `Replacement document ${newDocumentId} does not belong to application ${id}`,
        });
      }

      // 4. Perform atomic transactional version update
      const versionResult = db.replaceDocumentVersion(id, previousDocumentId, newDocumentId);
      if (!versionResult) {
        return reply.code(500).send({
          error: "Failed to update document versioning chain",
        });
      }

      const updatedRevision = versionResult.newDocument.revision;

      // Update relational database if Prisma is active
      if (await isPrismaConnected()) {
        try {
          await prisma.$transaction([
            prisma.document.update({
              where: { id: previousDocumentId },
              data: { isCurrent: false },
            }),
            prisma.document.update({
              where: { id: newDocumentId },
              data: {
                revision: updatedRevision,
                replacesId: previousDocumentId,
                isCurrent: true,
              },
            }),
            prisma.application.update({
              where: { id },
              data: {
                status: "SUBMITTED",
              },
            }),
          ]);
        } catch (err) {
          console.warn("[Resubmission] Relational update deferred:", err);
        }
      }

      // Reset application review state to Submitted for re-processing
      db.updateApplication(id, {
        status: "Submitted",
        resubmittedAt: new Date().toISOString(),
        rectificationCompletedAt: new Date().toISOString(),
      });

      // 5. Append tamper-evident cryptographic audit log
      AuditService.log({
        actorId: user.id,
        actorRole: user.role,
        action: "DOCUMENT_RECTIFICATION_RESUBMITTED",
        resourceRef: `Document:${newDocumentId} (rev.${updatedRevision} replaces ${previousDocumentId})`,
        appId: id,
      });

      // 6. Queue application for automated agent re-verification
      const job = await QueueService.enqueueApplication(id);

      return reply.code(200).send({
        success: true,
        message: "Document rectification successfully resubmitted. Agent verification pipeline initiated.",
        proposedRevision: updatedRevision,
        previousDocumentId,
        newDocumentId,
        jobId: job.id,
      });
    }
  );
}
