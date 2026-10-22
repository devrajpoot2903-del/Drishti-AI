import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateRequest } from "../middleware/auth";
import { db } from "../services/db.service";
import { prisma, isPrismaConnected } from "../services/prisma.service";
import { getVerificationResults } from "../services/verification.service";

export async function verificationRoutes(app: FastifyInstance) {
  app.get<{
    Params: { id: string };
  }>(
    "/api/applications/:id/verifications",
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

      // 2. Application-level authorization guard
      if (user && user.role === "INSTITUTION") {
        const belongsToUser =
          application.institutionId === user.institutionId ||
          application.institutionId === user.id ||
          application.submittedBy === user.id;

        if (!belongsToUser) {
          return reply.code(403).send({
            error: "Forbidden: You are not authorized to access verification records for this application.",
          });
        }
      }

      // 3. Retrieve verification ladder check results
      const results = await getVerificationResults(id);

      return reply.send({ results });
    }
  );
}
