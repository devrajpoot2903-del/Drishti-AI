import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import fs from "fs";
import { db } from "../services/db.service";
import { StorageService } from "../services/storage.service";
import { authenticateRequest } from "../middleware/auth";

export async function findingsRoutes(fastify: FastifyInstance) {
  // GET /api/findings/:id/evidence - retrieve evidence for a finding
  fastify.get(
    "/api/findings/:id/evidence",
    { preHandler: [authenticateRequest] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: string };
      const finding = db.findFindingById(id);

      if (!finding) {
        return reply.status(404).send({ error: `Finding ${id} not found` });
      }

      if (!finding.evidence) {
        return reply.send({
          findingId: id,
          hasEvidence: false,
          evidence: null,
          message: "Evidence is not available for this finding."
        });
      }

      return reply.send({
        findingId: id,
        hasEvidence: true,
        evidence: finding.evidence
      });
    }
  );

  // Stream generated evidence artifacts (e.g. ELA heatmap)
  const streamEvidenceHandler = async (request: FastifyRequest, reply: FastifyReply) => {
    const { filename } = request.params as { filename: string };
    const filePath = StorageService.getEvidencePath(filename);

    if (!filePath || !fs.existsSync(filePath)) {
      return reply.status(404).send({ error: "Evidence artifact not found on disk" });
    }

    const stream = fs.createReadStream(filePath);
    return reply
      .type("image/png")
      .header("Content-Disposition", `inline; filename="${filename}"`)
      .send(stream);
  };

  fastify.get("/api/findings/evidence/artifact/:filename", streamEvidenceHandler);
  fastify.get("/storage/evidence/:filename", streamEvidenceHandler);
}

