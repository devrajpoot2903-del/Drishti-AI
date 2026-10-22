import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

let prismaAvailable: boolean | null = null;
let lastCheck = 0;

/**
 * Utility helper to verify if PostgreSQL connection via Prisma is active and healthy.
 * Cached for 30s to avoid redundant connection timeouts when PostgreSQL is offline.
 */
export async function isPrismaConnected(): Promise<boolean> {
  const now = Date.now();
  if (prismaAvailable !== null && now - lastCheck < 30000) {
    return prismaAvailable;
  }
  try {
    lastCheck = now;
    await prisma.$queryRaw`SELECT 1`;
    prismaAvailable = true;
    return true;
  } catch {
    prismaAvailable = false;
    return false;
  }
}
