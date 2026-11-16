import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type { User } from "@prisma/client";
import { db } from "./db";
import { describeDevice } from "./device";
import { can, isStaff, type Permission } from "./permissions";

export const SESSION_COOKIE = "ba_session";
const SESSION_DAYS = 30;

export type SessionUser = Pick<
  User,
  | "id"
  | "role"
  | "fullName"
  | "username"
  | "email"
  | "whatsapp"
  | "permissions"
  | "avatarKey"
  | "isActive"
  | "mustChangePassword"
  | "parentPhone"
  | "school"
  | "createdAt"
>;

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 11);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function generatePassword(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[bytes[i]! % alphabet.length];
  return out;
}

/**
 * Creates a new session and enforces the ONE-DEVICE rule:
 * every other active session of this user is revoked with reason NEW_DEVICE,
 * so the previous device is signed out on its very next request / heartbeat.
 */
export async function createSession(userId: string) {
  const h = await headers();
  const ua = h.get("user-agent");
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || null;
  const token = randomBytes(32).toString("base64url");
  const id = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86400_000);

  await db.$transaction([
    db.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "NEW_DEVICE" },
    }),
    // housekeeping: forget old revoked sessions
    db.session.deleteMany({
      where: { userId, revokedAt: { lt: new Date(Date.now() - 14 * 86400_000) } },
    }),
    db.session.create({
      data: { id, userId, userAgent: ua, device: describeDevice(ua), ip, expiresAt },
    }),
    db.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } }),
  ]);

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function revokeAllSessions(userId: string, reason: string) {
  await db.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date(), revokedReason: reason },
  });
}

export type SessionState =
  | { status: "active"; user: SessionUser; sessionId: string }
  | { status: "revoked"; reason: string }
  | { status: "none" };

const userSelect = {
  id: true,
  role: true,
  fullName: true,
  username: true,
  email: true,
  whatsapp: true,
  permissions: true,
  avatarKey: true,
  isActive: true,
  mustChangePassword: true,
  parentPhone: true,
  school: true,
  createdAt: true,
} as const;

export const getSessionState = cache(async (): Promise<SessionState> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return { status: "none" };
  const session = await db.session.findUnique({
    where: { id: hashToken(token) },
    include: { user: { select: userSelect } },
  });
  if (!session) return { status: "none" };
  if (session.revokedAt) return { status: "revoked", reason: session.revokedReason ?? "ADMIN" };
  if (session.expiresAt < new Date()) return { status: "revoked", reason: "EXPIRED" };
  if (!session.user.isActive) return { status: "revoked", reason: "SUSPENDED" };

  // touch at most once every 5 minutes
  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60_000) {
    db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } }).catch(() => {});
  }
  return { status: "active", user: session.user, sessionId: session.id };
});

export async function getCurrentUser(): Promise<SessionUser | null> {
  const s = await getSessionState();
  return s.status === "active" ? s.user : null;
}

function loginRedirect(reason?: string): never {
  redirect(reason ? `/login?reason=${encodeURIComponent(reason)}` : "/login");
}

export async function requireUser(): Promise<SessionUser> {
  const s = await getSessionState();
  if (s.status === "active") return s.user;
  if (s.status === "revoked") loginRedirect(s.reason);
  loginRedirect();
}

export async function requireStudent() {
  const user = await requireUser();
  if (user.role !== "STUDENT") redirect("/admin");
  return user;
}

export async function requireStaff(perm?: Permission) {
  const user = await requireUser();
  if (!isStaff(user)) redirect("/dashboard");
  if (perm && !can(user, perm)) redirect("/admin?denied=" + perm);
  return user;
}

/** Staff member who holds at least one of the given permissions. */
export async function requireStaffAny(perms: Permission[]) {
  const user = await requireStaff();
  if (!perms.some((p) => can(user, p))) redirect("/admin?denied=" + perms[0]);
  return user;
}

export async function requireMaster() {
  const user = await requireUser();
  if (user.role !== "MASTER") redirect("/admin?denied=master");
  return user;
}

/** For server actions: returns the user or throws a friendly error. */
export async function actionUser() {
  const s = await getSessionState();
  if (s.status !== "active") throw new ActionError("Your session has ended. Please sign in again.");
  return s.user;
}

export async function actionStaff(perm?: Permission) {
  const user = await actionUser();
  if (!isStaff(user)) throw new ActionError("You don't have access to this action.");
  if (perm && !can(user, perm)) throw new ActionError("You don't have permission to do this. Ask Dr. Mina to enable it.");
  return user;
}

export async function actionMaster() {
  const user = await actionUser();
  if (user.role !== "MASTER") throw new ActionError("Only the master admin can do this.");
  return user;
}

export class ActionError extends Error {}

export type ActionResult<T = undefined> = { ok: true; data?: T; message?: string } | { ok: false; error: string };

/** Wraps a server action body, turning thrown errors into a typed result. */
export async function run<T>(fn: () => Promise<T | void>, message?: string): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { ok: true, data: (data ?? undefined) as T | undefined, message };
  } catch (e) {
    if (e instanceof ActionError) return { ok: false, error: e.message };
    // Next.js redirect/notFound errors must propagate
    if (e && typeof e === "object" && "digest" in e && typeof (e as { digest: unknown }).digest === "string" && (e as { digest: string }).digest.startsWith("NEXT_")) throw e;
    if (e && typeof e === "object" && "issues" in e) {
      const issues = (e as { issues: { message: string }[] }).issues;
      return { ok: false, error: issues[0]?.message ?? "Please check the form." };
    }
    console.error(e);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
