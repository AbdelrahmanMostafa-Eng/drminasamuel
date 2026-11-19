// Vercel build: generate Prisma client → apply migrations (when a database is configured)
// → make sure the master account exists → next build.
// Never fails just because the database isn't connected yet, so the first deploy always succeeds.
import { execSync } from "node:child_process";
import { migrationDatabaseUrl, runtimeDatabaseUrl } from "./db-env.mjs";
import { ensureMaster } from "./ensure-master.mjs";

const run = (cmd, env = {}) => execSync(cmd, { stdio: "inherit", env: { ...process.env, ...env } });
const banner = (msg) => console.log(`\n${"━".repeat(72)}\n${msg}\n${"━".repeat(72)}\n`);

// Prisma's schema needs DATABASE_URL to exist even for `generate`; any valid-looking value works there.
const runtimeUrl = runtimeDatabaseUrl();
const placeholder = "postgresql://user:password@localhost:5432/placeholder";
run("npx prisma generate", { DATABASE_URL: runtimeUrl || placeholder });
run("node scripts/copy-pdf-worker.mjs");

const migrationUrl = migrationDatabaseUrl();
if (!migrationUrl) {
  banner(
    "⚠️  No database configured — skipping migrations.\n" +
      "   Add DATABASE_URL in Vercel → Project → Settings → Environment Variables\n" +
      "   (or connect Supabase/Neon from Vercel → Storage), then redeploy.",
  );
} else {
  try {
    run("npx prisma migrate deploy", { DATABASE_URL: migrationUrl });
    // Dr. Mina's master account must exist before anyone can sign in to the admin dashboard.
    await ensureMaster(migrationUrl);
  } catch {
    banner(
      "⚠️  Could not apply database migrations (see the error above).\n" +
        "   The site is still being deployed. Fix the connection string and redeploy,\n" +
        "   or run `npx prisma migrate deploy` from your computer with the same DATABASE_URL.",
    );
    if (process.env.STRICT_MIGRATIONS === "1") process.exit(1);
  }
}

run("npx next build", runtimeUrl ? { DATABASE_URL: runtimeUrl } : {});
