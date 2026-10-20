import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { AuthService } from "../services/auth.service";
import { signToken, authenticateRequest } from "../middleware/auth";

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post("/api/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    if (!body || !body.email || !body.password) {
      return reply.status(400).send({ error: "Missing required fields: email and password" });
    }

    const session = await AuthService.authenticate(body.email, body.password);
    if (!session) {
      return reply.status(401).send({ error: "Invalid credentials" });
    }

    const token = signToken(session);
    return reply.send({
      token,
      user: session
    });
  });

  fastify.get(
    "/api/auth/me",
    { preHandler: [authenticateRequest] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      return reply.send({ user: request.user });
    }
  );

  fastify.post("/api/auth/logout", async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ success: true, message: "Logged out successfully" });
  });
}
