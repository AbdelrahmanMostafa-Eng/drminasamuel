import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { hashPassword } from "./auth";

/** Dr. Mina's master username (SEED_MASTER_USERNAME, default "drmina"). */
export const masterUsername = () => (process.env.SEED_MASTER_USERNAME || "drmina").trim().toLowerCase();

const sha = (v: string) => createHash("sha256").update(v).digest();
const same = (a: string, b: string) => timingSafeEqual(sha(a), sha(b));

/**
 * Self-repair for the master account, used when a sign-in with the master username fails:
 *  - no master account at all → the first password (SEED_MASTER_PASSWORD, default "ChangeMe-2026!") creates it,
 *    with a new password requested right after signing in;
 *  - locked out → MASTER_RESET_PASSWORD (set in Vercel) resets it once.
 * The deploy step (scripts/ensure-master.mjs) does the same; this covers deploys that couldn't reach the database.
 * Returns true when the account was created or reset, so the sign-in can be retried.
 */
export async function repairMasterForLogin(identifier: string, password: string) {
  const username = masterUsername();
  if (identifier !== username) return false;
  const master = await db.user.findFirst({ where: { role: "MASTER" }, orderBy: { createdAt: "asc" } });

  if (!master) {
    const initial = process.env.SEED_MASTER_PASSWORD || "ChangeMe-2026!";
    if (!same(password, initial)) return false;
    if (await db.user.findUnique({ where: { username } })) return false;
    await db.user.create({
      data: { role: "MASTER", username, fullName: process.env.SEED_MASTER_NAME || "Dr. Mina Samuel", passwordHash: await hashPassword(initial), mustChangePassword: true },
    });
    return true;
  }

  const reset = (process.env.MASTER_RESET_PASSWORD || "").trim();
  if (reset.length < 8 || master.username !== username || !same(password, reset)) return false;
  const fingerprint = createHash("sha256").update(`${master.id}:${reset}`).digest("hex");
  const done = await db.setting.findUnique({ where: { key: "masterPasswordReset" } });
  if ((done?.value as { fingerprint?: string } | null)?.fingerprint === fingerprint) return false;
  await db.user.update({ where: { id: master.id }, data: { passwordHash: await hashPassword(reset), mustChangePassword: false, isActive: true } });
  await db.session.updateMany({ where: { userId: master.id, revokedAt: null }, data: { revokedAt: new Date(), revokedReason: "PASSWORD_CHANGED" } });
  await db.setting.upsert({
    where: { key: "masterPasswordReset" },
    create: { key: "masterPasswordReset", value: { fingerprint, at: new Date().toISOString() } },
    update: { value: { fingerprint, at: new Date().toISOString() } },
  });
  return true;
}
