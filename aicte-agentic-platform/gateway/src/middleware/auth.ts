import { FastifyRequest, FastifyReply } from "fastify";
import crypto from "crypto";
import { AuthService, UserSession } from "../services/auth.service";

const JWT_SECRET = process.env.JWT_SECRET || "aicte_secure_session_secret_key_2026";

export interface AuthenticatedUser extends UserSession {}

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthenticatedUser;
  }
}

export function signToken(payload: UserSession): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const exp = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString("base64url");
  const signature = crypto
    .createHmac("sha256", JWT_SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): UserSession | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;

    const expectedSignature = crypto
      .createHmac("sha256", JWT_SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (signature !== expectedSignature) return null;

    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired
    }

    return {
      id: payload.id,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      institutionId: payload.institutionId,
      institutionName: payload.institutionName
    };
  } catch (err) {
    return null;
  }
}

export async function authenticateRequest(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    reply.status(401).send({ error: "Unauthorized: Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.substring(7);
  const session = verifyToken(token);
  if (!session) {
    reply.status(401).send({ error: "Unauthorized: Invalid or expired session token" });
    return;
  }

  request.user = session;
}

export function requireRole(allowedRoles: ("INSTITUTION" | "SCRUTINY_OFFICER" | "ADMIN")[]) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user) {
      reply.status(401).send({ error: "Unauthorized: Authentication required" });
      return;
    }

    if (!allowedRoles.includes(request.user.role)) {
      reply.status(403).send({
        error: `Forbidden: Action requires one of role(s): [${allowedRoles.join(", ")}]. Current role: '${request.user.role}'`
      });
      return;
    }
  };
}
