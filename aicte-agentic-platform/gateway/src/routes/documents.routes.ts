import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import path from "path";
import { db } from "../services/db.service";
import { StorageService } from "../services/storage.service";
import { authenticateRequest } from "../middleware/auth";
import { AuditService } from "../services/audit.service";

export async function documentsRoutes(fastify: FastifyInstance) {
  // POST /api/documents/upload - multipart upload for an application
  fastify.post(
    "/api/documents/upload",
    { preHandler: [authenticateRequest] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const isMultipart = request.isMultipart();
      if (!isMultipart) {
        return reply.status(400).send({ error: "Expected multipart/form-data payload" });
      }

      const parts = request.parts();
      let applicationId: string | null = null;
      let documentType: string = "SUPPORTING_DOCUMENT";
      const uploadedDocs: any[] = [];

      for await (const part of parts) {
        if (part.type === "field") {
          if (part.fieldname === "applicationId") {
            applicationId = part.value as string;
          } else if (part.fieldname === "documentType") {
            documentType = part.value as string;
          }
        } else if (part.type === "file") {
          const buffer = await part.toBuffer();
          const stored = await StorageService.saveUploadedBuffer(
            buffer,
            part.filename,
            part.mimetype
          );

          uploadedDocs.push({
            ...stored,
            documentType
          });
        }
      }

      if (!applicationId) {
        return reply.status(400).send({ error: "Missing required form field 'applicationId'" });
      }

      const app = db.findApplicationById(applicationId);
      if (!app) {
        return reply.status(404).send({ error: `Application ${applicationId} not found` });
      }

      const persistedDocs: any[] = [];
      for (const d of uploadedDocs) {
        const docRecord = db.createDocument({
          id: d.id,
          applicationId,
          originalFilename: d.originalFilename,
          storageFilename: d.storageFilename,
          storagePath: d.storagePath,
          mimeType: d.mimeType,
          fileSize: d.sizeBytes,
          sha256: d.sha256,
          documentType: d.documentType,
          status: "UPLOADED"
        });
        persistedDocs.push(docRecord);

        AuditService.log({
          actorId: request.user!.id,
          actorRole: request.user!.role,
          action: "DOCUMENT_UPLOADED",
          resourceRef: `Document:${d.id}`,
          appId: applicationId
        });
      }

      return reply.status(201).send({
        success: true,
        documents: persistedDocs
      });
    }
  );

  // GET /api/documents/:id/preview - preview / stream document with auth
  fastify.get(
    "/api/documents/:id/preview",
    { preHandler: [authenticateRequest] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const doc = db.findDocumentById(id);
      if (!doc) {
        return reply.status(404).send({ error: `Document ${id} not found` });
      }

      const filePath = StorageService.getDocumentPath(doc.storageFilename);
      if (!filePath || !fs.existsSync(filePath)) {
        return reply.status(404).send({ error: "Document file not found on disk" });
      }

      const stream = fs.createReadStream(filePath);
      return reply
        .type(doc.mimeType || "application/octet-stream")
        .header("Content-Disposition", `inline; filename="${doc.originalFilename}"`)
        .send(stream);
    }
  );
}
