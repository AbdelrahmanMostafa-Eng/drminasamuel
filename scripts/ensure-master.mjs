// Makes sure Dr. Mina's master-admin account exists on the live database. Runs on every deploy,
// right after the database migrations (see vercel-build.mjs), and never fails the deploy.
//
//  • No master account yet → creates it:
//      username  SEED_MASTER_USERNAME (default "drmina")
//      password  SEED_MASTER_PASSWORD (default "ChangeMe-2026!")
//      name      SEED_MASTER_NAME     (default "Dr. Mina Samuel")
//    and asks for a new password at the first sign-in.
//
//  • Locked out of an existing master account? In Vercel → Settings → Environment Variables set
//    MASTER_RESET_PASSWORD to a new password and redeploy. The master's password (and username, if
//    SEED_MASTER_USERNAME is set) is reset once. Later deploys with the same value change nothing,
//    so it is safe to leave the variable in place — but you can remove it after signing in.
import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export async function ensureMaster(databaseUrl) {
  const db = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    const username = (process.env.SEED_MASTER_USERNAME || "drmina").trim().toLowerCase();
    const name = (process.env.SEED_MASTER_NAME || "Dr. Mina Samuel").trim();
    const master = await db.user.findFirst({ where: { role: "MASTER" }, orderBy: { createdAt: "asc" } });

    if (!master) {
      const taken = await db.user.findUnique({ where: { username } });
      if (taken) {
        console.log(`⚠️  Can't create the master account: the username "${username}" is used by another account. Set SEED_MASTER_USERNAME to a different one and redeploy.`);
        return;
      }
      const password = process.env.SEED_MASTER_PASSWORD || "ChangeMe-2026!";
      await db.user.create({
        data: { role: "MASTER", username, fullName: name, passwordHash: await bcrypt.hash(password, 11), mustChangePassword: true },
      });
      console.log(`✓ Created the master account @${username} — sign in at /login (a new password is requested at first sign-in).`);
      return;
    }

    const reset = (process.env.MASTER_RESET_PASSWORD || "").trim();
    if (!reset) {
      console.log(`✓ Master account exists (@${master.username}).`);
      return;
    }
    if (reset.length < 8) {
      console.log("⚠️  MASTER_RESET_PASSWORD must be at least 8 characters — nothing was changed.");
      return;
    }
    const fingerprint = createHash("sha256").update(`${master.id}:${reset}`).digest("hex");
    const done = await db.setting.findUnique({ where: { key: "masterPasswordReset" } });
    if (done && done.value && done.value.fingerprint === fingerprint) {
      console.log(`✓ Master account exists (@${master.username}); MASTER_RESET_PASSWORD was already applied.`);
      return;
    }
    const newUsername = process.env.SEED_MASTER_USERNAME ? username : master.username;
    const clash = newUsername !== master.username ? await db.user.findUnique({ where: { username: newUsername } }) : null;
    await db.user.update({
      where: { id: master.id },
      data: { passwordHash: await bcrypt.hash(reset, 11), mustChangePassword: false, isActive: true, ...(clash ? {} : { username: newUsername }) },
    });
    await db.session.updateMany({ where: { userId: master.id, revokedAt: null }, data: { revokedAt: new Date(), revokedReason: "PASSWORD_CHANGED" } });
    await db.setting.upsert({
      where: { key: "masterPasswordReset" },
      create: { key: "masterPasswordReset", value: { fingerprint, at: new Date().toISOString() } },
      update: { value: { fingerprint, at: new Date().toISOString() } },
    });
    console.log(`✓ Master password reset from MASTER_RESET_PASSWORD — sign in as @${clash ? master.username : newUsername}.`);
  } catch (e) {
    console.log("⚠️  Could not check the master account:", e instanceof Error ? e.message : e);
  } finally {
    await db.$disconnect();
  }
}
