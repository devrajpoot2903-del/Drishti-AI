import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AuditService } from "../services/audit.service";
import { authenticateRequest } from "../middleware/auth";

export async function auditRoutes(fastify: FastifyInstance) {
  // GET /api/audit - list all audit events
  fastify.get("/api/audit", async (request: FastifyRequest, reply: FastifyReply) => {
    const logs = AuditService.getLogs();
    return reply.send(logs);
  });

  // GET /api/audit/verify - recompute and verify SHA-256 hash chain
  fastify.get("/api/audit/verify", async (request: FastifyRequest, reply: FastifyReply) => {
    const result = AuditService.verifyChain();
    return reply.send(result);
  });
}
