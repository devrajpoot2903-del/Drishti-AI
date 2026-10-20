import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ImpactService } from "../services/impact.service";
import { authenticateRequest, requireRole } from "../middleware/auth";
import { AuditService } from "../services/audit.service";

export async function analyticsRoutes(fastify: FastifyInstance) {
  // GET /api/analytics/impact - get genuine impact metrics
  fastify.get("/api/analytics/impact", async (request: FastifyRequest, reply: FastifyReply) => {
    const metrics = ImpactService.calculateMetrics();
    return reply.send(metrics);
  });

  // POST /api/analytics/impact/config - configure manual scrutiny baseline
  fastify.post(
    "/api/analytics/impact/config",
    { preHandler: [authenticateRequest, requireRole(["ADMIN"])] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = request.body as any;
      if (!body.baselineManualMinutes || typeof body.baselineManualMinutes !== "number") {
        return reply.status(400).send({ error: "baselineManualMinutes is required and must be a number" });
      }

      const methodology = body.baselineMethodology || "Custom administrative scrutiny benchmark.";
      const updatedConfig = ImpactService.updateBaselineConfig(body.baselineManualMinutes, methodology);

      AuditService.log({
        actorId: request.user!.id,
        actorRole: request.user!.role,
        action: "CONFIG_BASELINE_UPDATED",
        resourceRef: `Config:baselineManualMinutes=${body.baselineManualMinutes}`
      });

      return reply.send({
        success: true,
        config: updatedConfig
      });
    }
  );
}
