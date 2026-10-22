import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateRequest } from "../middleware/auth";
import { db } from "../services/db.service";
import { prisma, isPrismaConnected } from "../services/prisma.service";

export async function ocrRoutes(app: FastifyInstance) {
  app.get<{
    Params: { id: string };
  }>(
    "/api/applications/:id/ocr",
    {
      preHandler: [authenticateRequest],
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const user = request.user;

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
          error: "Application not found",
        });
      }

      // 2. Application-level authorization check
      if (user && user.role === "INSTITUTION") {
        const belongsToUser =
          application.institutionId === user.institutionId ||
          application.institutionId === user.id ||
          application.submittedBy === user.id;

        if (!belongsToUser) {
          return reply.code(403).send({
            error: "Forbidden: You are not authorized to view extraction records for this application.",
          });
        }
      }

      // 3. Retrieve documents with extracted structured fields
      let documents: any[] = [];
      if (await isPrismaConnected()) {
        try {
          documents = await prisma.document.findMany({
            where: { applicationId: id },
            include: {
              extractedFields: true,
            },
          });
        } catch {
          // fallback
        }
      }

      if (documents.length === 0) {
        documents = db.findDocumentsByApplicationId(id);
      }

      return reply.send({
        results: documents.map((document) => {
          let fields = document.extractedFields || [];
          if (!Array.isArray(fields) && typeof fields === "object") {
            fields = Object.entries(fields).map(([name, val], idx) => ({
              id: `fld_${idx}`,
              fieldName: name,
              fieldValue: typeof val === "object" ? JSON.stringify(val) : String(val),
              confidence: 0.95,
              pageNumber: 1,
            }));
          }

          return {
            documentId: document.id,
            documentName:
              document.originalFilename ||
              document.originalName ||
              document.storageFilename ||
              document.name ||
              "Document",
            extractedText: document.extractedText ?? "",
            status: document.ocrStatus || "EXTRACTED",
            fields: fields.map((field: any, idx: number) => ({
              id: field.id || `fld_${idx}`,
              name: field.fieldName || field.name || "Field",
              value: String(field.fieldValue ?? field.value ?? ""),
              confidence: field.confidence ?? null,
              pageNumber: field.pageNumber ?? 1,
            })),
          };
        }),
      });
    }
  );
}
