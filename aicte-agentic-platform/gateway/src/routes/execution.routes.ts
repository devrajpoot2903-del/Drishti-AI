import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma, isPrismaConnected } from "../services/prisma.service";
import { authenticateRequest } from "../middleware/auth";
import { db } from "../services/db.service";

export async function executionRoutes(app: FastifyInstance) {
  app.get<{
    Params: { applicationId: string };
  }>(
    "/api/applications/:applicationId/executions",
    {
      preHandler: [authenticateRequest],
    },
    async (
      request: FastifyRequest<{ Params: { applicationId: string } }>,
      reply: FastifyReply
    ) => {
      const { applicationId } = request.params;
      const user = request.user;

      // 1. Resolve application with application-level authorization guard
      let application: any = null;
      const canUsePrisma = await isPrismaConnected();

      if (canUsePrisma) {
        try {
          application = await prisma.application.findUnique({
            where: { id: applicationId },
          });
        } catch {
          // Fall through to memory / json store
        }
      }

      if (!application) {
        application = db.findApplicationById(applicationId);
      }

      if (!application) {
        return reply.code(404).send({
          error: "Application not found",
        });
      }

      // Application-level authorization check:
      // Institutional roles are restricted to their assigned institution dossiers
      if (user && user.role === "INSTITUTION") {
        const belongsToUser =
          application.institutionId === user.institutionId ||
          application.institutionId === user.id ||
          application.submittedBy === user.id;

        if (!belongsToUser) {
          return reply.code(403).send({
            error: "Forbidden: You are not authorized to view executions for this dossier.",
          });
        }
      }

      // 2. Query execution records from Prisma first, falling back to local state
      let executions: any[] = [];
      if (canUsePrisma) {
        try {
          const prismaExecutions = await prisma.agentExecution.findMany({
            where: { applicationId },
            orderBy: { executedAt: "asc" },
          });

          if (prismaExecutions && prismaExecutions.length > 0) {
            executions = prismaExecutions.map((e) => ({
              id: e.id,
              agentName: e.agentName,
              status: e.status,
              startedAt: e.executedAt.toISOString(),
              completedAt: e.executedAt.toISOString(),
              routingReason: e.reason,
              toolUsed: e.executionDetails,
            }));
          }
        } catch {
          // Prisma unavailable or table empty
        }
      }

      // If no records in relational store, use recorded executions from application state
      if (executions.length === 0 && application.agentExecutions) {
        executions = (application.agentExecutions || []).map((e: any, idx: number) => ({
          id: e.id || `exec_${applicationId}_${idx + 1}`,
          agentName: e.agentName || e.name || "Agent",
          status: e.status || "COMPLETED",
          startedAt:
            e.startedAt ||
            e.executedAt ||
            application.processedAt ||
            application.submittedAt ||
            new Date().toISOString(),
          completedAt: e.completedAt || application.processedAt || null,
          routingReason: e.routingReason || e.reason || null,
          toolUsed:
            e.toolUsed ||
            e.tool ||
            (e.details ? JSON.stringify(e.details) : null),
        }));
      }

      return reply.send({ executions });
    }
  );
}
