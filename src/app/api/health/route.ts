import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureStorageTables, storageDriver } from "@/lib/storage";

export const dynamic = "force-dynamic";

/** Plain yes/no status of the live site's moving parts — no personal data. */
export async function GET() {
  let database = false;
  let masterAccount = false;
  let storageReady = storageDriver !== "db";
  try {
    await db.$queryRaw`SELECT 1`;
    database = true;
    masterAccount = !!(await db.user.findFirst({ where: { role: "MASTER" }, select: { id: true } }));
    if (storageDriver === "db") {
      await ensureStorageTables();
      await db.storedFile.count();
      storageReady = true;
    }
  } catch {
    /* reported as false */
  }
  return NextResponse.json(
    { ok: database && storageReady, database, masterAccount, storage: storageDriver, storageReady, version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null },
    { headers: { "Cache-Control": "no-store" } },
  );
}
