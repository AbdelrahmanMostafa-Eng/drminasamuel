// Resolves database URLs across hosting setups:
//  - DATABASE_URL / DIRECT_URL (manual setup, Docker, Neon, Railway…)
//  - POSTGRES_PRISMA_URL / POSTGRES_URL / POSTGRES_URL_NON_POOLING (Supabase & Neon Vercel integrations)

const first = (...keys) => keys.map((k) => process.env[k]).find((v) => v && v.trim());

/** Supabase's transaction pooler (port 6543) needs pgbouncer=true for Prisma. */
export function withPoolerParams(url) {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (u.port === "6543" && !u.searchParams.has("pgbouncer")) u.searchParams.set("pgbouncer", "true");
    return u.toString();
  } catch {
    return url;
  }
}

/** URL the running app uses (pooled is fine). */
export function runtimeDatabaseUrl() {
  return withPoolerParams(first("DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL", "SUPABASE_DB_URL"));
}

/** URL for migrations — prefer a direct / session connection (migrations don't work through a transaction pooler). */
export function migrationDatabaseUrl() {
  return first("DIRECT_URL", "POSTGRES_URL_NON_POOLING", "DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL", "SUPABASE_DB_URL");
}
