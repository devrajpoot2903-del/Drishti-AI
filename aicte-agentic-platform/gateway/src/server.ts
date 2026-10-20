import fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import sensible from "@fastify/sensible";
import dotenv from "dotenv";

import { AuthService } from "./services/auth.service";
import { authRoutes } from "./routes/auth.routes";
import { applicationsRoutes } from "./routes/applications.routes";
import { documentsRoutes } from "./routes/documents.routes";
import { findingsRoutes } from "./routes/findings.routes";
import { auditRoutes } from "./routes/audit.routes";
import { analyticsRoutes } from "./routes/analytics.routes";
import { workflowRoutes } from "./routes/workflow.routes";

dotenv.config();

const PORT = Number(process.env.PORT) || 5001;
const HOST = process.env.HOST || "0.0.0.0";

export async function buildServer() {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL || "info"
    }
  });

  // Plugins
  await app.register(cors, {
    origin: true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
  });

  await app.register(multipart, {
    limits: {
      fileSize: 25 * 1024 * 1024 // 25 MB
    }
  });

  await app.register(sensible);

  // Health check
  app.get("/health", async () => {
    return {
      status: "ok",
      service: "aicte-gateway",
      timestamp: new Date().toISOString()
    };
  });

  // Register all routes
  await app.register(authRoutes);
  await app.register(applicationsRoutes);
  await app.register(documentsRoutes);
  await app.register(findingsRoutes);
  await app.register(auditRoutes);
  await app.register(analyticsRoutes);
  await app.register(workflowRoutes);

  return app;
}

async function start() {
  try {
    // Seed initial users with bcrypt hashes if not already present
    await AuthService.initSeedUsers();

    const app = await buildServer();
    await app.listen({ port: PORT, host: HOST });
    console.log(`[AICTE Gateway] Server running at http://${HOST}:${PORT}`);
  } catch (err) {
    console.error("[AICTE Gateway] Fatal startup error:", err);
    process.exit(1);
  }
}

if (require.main === module) {
  start();
}
