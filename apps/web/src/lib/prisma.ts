import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { _prisma?: PrismaClient };

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

/** Lazily create a singleton client backed by the pg driver adapter. */
export function getPrisma(): PrismaClient {
  if (globalForPrisma._prisma) return globalForPrisma._prisma;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set — database features are disabled.");
  }
  const adapter = new PrismaPg({ connectionString });
  const client = new PrismaClient({ adapter });
  globalForPrisma._prisma = client;
  return client;
}
