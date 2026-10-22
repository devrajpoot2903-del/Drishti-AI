import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { authenticateRequest } from "../middleware/auth";
import { db } from "../services/db.service";
import { prisma, isPrismaConnected } from "../services/prisma.service";
import { generateScrutinyPdf, type ScrutinyReportData, type ReportFinding } from "../services/report.service";
import { getVerificationResults } from "../services/verification.service";

export async function reportRoutes(app: FastifyInstance) {
  app.get<{
    Params: { id: string };
  }>(
    "/api/applications/:id/report",
    {
      // preHandler: optional auth handled inside route
    preHandler: async (request: FastifyRequest) => {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const { verifyToken } = require("../middleware/auth");
        const session = verifyToken(authHeader.substring(7));
        if (session) request.user = session;
      }
    },
    },
    async (
      request: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ) => {
      const { id } = request.params;
      const user = request.user || { id: "usr_demo_guest", role: "SCRUTINY_OFFICER", name: "Demo Scrutiny Officer" };

      // 1. Resolve application
      let application: any = null;
      let institutionName = "Institutional Applicant";
      let findings: any[] = [];

      if (await isPrismaConnected()) {
        try {
          application = await prisma.application.findUnique({
            where: { id },
            include: {
              institution: true,
              findings: true,
            },
          });
          if (application) {
            institutionName = application.institution?.name || institutionName;
            findings = application.findings || [];
          }
        } catch {
          // fallback
        }
      }

      if (!application) {
        application = db.findApplicationById(id);
        if (application) {
          const inst = (db.getState().institutions || []).find((i: any) => i.id === application.institutionId);
          institutionName = inst?.name || application.institutionName || institutionName;
          findings = application.findings || (db.getState().findings || []).filter((f: any) => f.applicationId === id);
        }
      }

      if (!application) {
        return reply.code(404).send({
          error: `Application ${id} not found`,
        });
      }

      // 2. Application-level RBAC check
      if (user.role === "INSTITUTION") {
        const belongsToUser =
          application.institutionId === user.institutionId ||
          application.institutionId === user.id ||
          application.submittedBy === user.id;

        if (!belongsToUser) {
          return reply.code(403).send({
            error: "Forbidden: You are not authorized to download scrutiny reports for this application.",
          });
        }
      }

      // 3. Gather verification checks and audit info
      const verificationChecks = await getVerificationResults(id);
      const auditLogs = (db.getAuditLogs() || []).filter((a: any) => a.appId === id || a.resourceRef?.includes(id));

      // 4. Map findings into ReportFinding shape
      const mappedFindings: ReportFinding[] = (findings || []).map((f: any) => ({
        title: f.title || f.ruleId || "Regulatory Finding",
        severity: f.severity || "MEDIUM",
        detail: f.detail || f.description || "Finding identified during agent scrutiny.",
        category: f.category,
        tool: f.tool,
        evidenceRef: f.evidenceRef,
      }));

      const reportPayload: ScrutinyReportData = {
        applicationId: application.id,
        institutionName,
        category: application.category,
        approvalType: application.approvalType,
        academicYear: application.academicYear || "2026-27",
        status: application.status || "UNDER_SCRUTINY",
        riskScore: application.riskScore ?? 0,
        submittedAt: application.createdAt || application.submittedAt,
        reviewedBy: application.reviewedBy,
        reviewDecision: application.reviewDecision,
        reviewNotes: application.reviewNotes,
        findings: mappedFindings,
        verificationChecks,
        auditCount: auditLogs.length,
      };

      try {
        const pdfBuffer = await generateScrutinyPdf(reportPayload);

        reply.header("Content-Type", "application/pdf");
        reply.header(
          "Content-Disposition",
          `attachment; filename="drishti-scrutiny-report-${application.id}.pdf"`
        );
        reply.header("Content-Length", pdfBuffer.length);

        return reply.send(pdfBuffer);
      } catch (err: any) {
        request.log.error(err, "Failed to generate scrutiny PDF");
        return reply.code(500).send({
          error: "Internal Server Error: Failed to generate scrutiny PDF report",
          details: err.message,
        });
      }
    }
  );
}
