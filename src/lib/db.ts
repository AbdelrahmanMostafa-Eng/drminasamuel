import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Works with a plain DATABASE_URL or with the variables that the Supabase / Neon
 * Vercel integrations create (POSTGRES_PRISMA_URL, POSTGRES_URL).
 */
function databaseUrl() {
  const raw = [process.env.DATABASE_URL, process.env.POSTGRES_PRISMA_URL, process.env.POSTGRES_URL, process.env.SUPABASE_DB_URL].find((v) => v && v.trim());
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    // Supabase transaction pooler needs pgbouncer mode for Prisma
    if (u.port === "6543" && !u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
    return u.toString();
  } catch {
    return raw;
  }
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
