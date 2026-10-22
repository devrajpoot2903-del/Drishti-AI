import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AuditService } from "../services/audit.service";

export async function auditRoutes(fastify: FastifyInstance) {
  // GET /api/audit - list all audit events (with optional ?applicationId=... or ?appId=...)
  fastify.get<{
    Querystring: { applicationId?: string; appId?: string }
  }>("/api/audit", async (request: FastifyRequest<{ Querystring: { applicationId?: string; appId?: string } }>, reply: FastifyReply) => {
    let logs = AuditService.getLogs();
    const query = request.query as any;
    const targetAppId = query?.applicationId || query?.appId;
    if (targetAppId) {
      logs = logs.filter(
        (log: any) =>
          log.appId === targetAppId ||
          log.applicationId === targetAppId ||
          (log.resourceRef && typeof log.resourceRef === "string" && log.resourceRef.includes(targetAppId))
      );
    }
    return reply.send(logs);
  });

  // GET /api/audit/verify - recompute and verify SHA-256 hash chain
  fastify.get("/api/audit/verify", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = AuditService.verifyChain();
    return reply.send(result);
  });
}
