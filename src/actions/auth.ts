"use server";

import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  ActionError,
  actionUser,
  createSession,
  getSessionState,
  hashPassword,
  hashToken,
  run,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/auth";
import { normalizePhone } from "@/lib/utils";
import { audit } from "@/lib/audit";

const attempts = new Map<string, { n: number; at: number }>();
function throttle(key: string) {
  const now = Date.now();
  const a = attempts.get(key);
  if (a && now - a.at < 10 * 60_000) {
    if (a.n >= 8) throw new ActionError("Too many attempts. Please wait a few minutes and try again.");
    a.n++;
  } else attempts.set(key, { n: 1, at: now });
}

function safeNext(next: string | undefined | null, fallback: string) {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return fallback;
}

const nameRe = /^[A-Za-z][A-Za-z .'-]*$/;

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(5, "Please enter your full name.")
      .max(80)
      .refine((v) => nameRe.test(v), "Please write your full name in English letters.")
      .refine((v) => v.split(/\s+/).filter(Boolean).length >= 2, "Please enter at least your first and last name."),
    whatsapp: z.string().trim().min(8, "Enter your WhatsApp number."),
    email: z.string().trim().toLowerCase().email("Enter a valid email address."),
    parentPhone: z.string().trim().min(8, "Enter your parent's phone number."),
    school: z.string().trim().max(100).optional(),
    password: z.string().min(8, "Password must be at least 8 characters.").max(100),
    confirm: z.string(),
    next: z.string().optional(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match.", path: ["confirm"] });

export async function registerAction(input: z.input<typeof registerSchema>) {
  const res = await run(async () => {
    const d = registerSchema.parse(input);
    const whatsapp = normalizePhone(d.whatsapp);
    if (!whatsapp) throw new ActionError("Enter a valid WhatsApp number, e.g. 01012345678.");
    const parentPhone = normalizePhone(d.parentPhone);
    if (!parentPhone) throw new ActionError("Parent's number looks invalid, e.g. 01012345678.");
    const exists = await db.user.findFirst({ where: { OR: [{ email: d.email }, { whatsapp }] }, select: { email: true } });
    if (exists) throw new ActionError(exists.email === d.email ? "An account with this email already exists. Try signing in." : "This WhatsApp number is already registered. Try signing in.");
    const user = await db.user.create({
      data: {
        role: "STUDENT",
        fullName: d.fullName.replace(/\s+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        email: d.email,
        whatsapp,
        parentPhone,
        school: d.school || null,
        passwordHash: await hashPassword(d.password),
      },
    });
    await createSession(user.id);
    await audit(user, "student.registered", `${user.fullName} (${whatsapp})`);
    return safeNext(d.next, "/dashboard");
  });
  if (res.ok && res.data) redirect(res.data);
  return res;
}

const loginSchema = z.object({
  identifier: z.string().trim().min(3, "Enter your email, WhatsApp number or username."),
  password: z.string().min(1, "Enter your password."),
  next: z.string().optional(),
});

export async function loginAction(input: z.input<typeof loginSchema>) {
  const res = await run(async () => {
    const d = loginSchema.parse(input);
    const h = await headers();
    throttle(`${d.identifier.toLowerCase()}|${h.get("x-forwarded-for") ?? ""}`);
    const id = d.identifier.toLowerCase();
    const phone = normalizePhone(d.identifier);
    const user = await db.user.findFirst({
      where: { OR: [{ email: id }, { username: id }, ...(phone ? [{ whatsapp: phone }] : [])] },
    });
    if (!user || !(await verifyPassword(d.password, user.passwordHash))) throw new ActionError("Incorrect login details. Please check and try again.");
    if (!user.isActive) throw new ActionError("This account is suspended. Please contact the Bioacademy team on WhatsApp.");
    await createSession(user.id);
    attempts.delete(`${id}|${h.get("x-forwarded-for") ?? ""}`);
    if (user.mustChangePassword) return "/account/password?forced=1";
    return safeNext(d.next, user.role === "STUDENT" ? "/dashboard" : "/admin");
  });
  if (res.ok && res.data) redirect(res.data);
  return res;
}

export async function logoutAction() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.updateMany({ where: { id: hashToken(token), revokedAt: null }, data: { revokedAt: new Date(), revokedReason: "LOGOUT" } });
  }
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}

const pwSchema = z
  .object({ current: z.string().optional(), password: z.string().min(8, "Password must be at least 8 characters."), confirm: z.string() })
  .refine((d) => d.password === d.confirm, { message: "Passwords don't match.", path: ["confirm"] });

export async function changePasswordAction(input: z.input<typeof pwSchema>) {
  return run(async () => {
    const d = pwSchema.parse(input);
    const me = await actionUser();
    const user = await db.user.findUniqueOrThrow({ where: { id: me.id } });
    if (!user.mustChangePassword) {
      if (!d.current || !(await verifyPassword(d.current, user.passwordHash))) throw new ActionError("Your current password is incorrect.");
    }
    await db.user.update({ where: { id: me.id }, data: { passwordHash: await hashPassword(d.password), mustChangePassword: false } });
    await audit(me, "account.password_changed");
    return user.role === "STUDENT" ? "/dashboard" : "/admin";
  }, "Password updated");
}

const profileSchema = z.object({
  fullName: z.string().trim().min(3).max(80),
  email: z.string().trim().toLowerCase().email("Enter a valid email address.").optional().or(z.literal("")),
  parentPhone: z.string().trim().optional(),
  school: z.string().trim().max(100).optional(),
  avatarKey: z.string().optional().nullable(),
});

export async function updateProfileAction(input: z.input<typeof profileSchema>) {
  return run(async () => {
    const d = profileSchema.parse(input);
    const me = await actionUser();
    if (me.role === "STUDENT" && !nameRe.test(d.fullName)) throw new ActionError("Please write your full name in English letters.");
    if (d.avatarKey && !d.avatarKey.startsWith(`public/avatars/${me.id}-`)) throw new ActionError("Invalid photo.");
    if (d.email) {
      const taken = await db.user.findFirst({ where: { email: d.email, NOT: { id: me.id } } });
      if (taken) throw new ActionError("That email is used by another account.");
    }
    const parentPhone = d.parentPhone ? normalizePhone(d.parentPhone) : null;
    if (me.role === "STUDENT" && !parentPhone) throw new ActionError("Enter a valid parent's phone number.");
    await db.user.update({
      where: { id: me.id },
      data: {
        fullName: d.fullName,
        email: d.email || (me.role === "STUDENT" ? me.email : null),
        parentPhone,
        school: d.school || null,
        ...(d.avatarKey !== undefined ? { avatarKey: d.avatarKey } : {}),
      },
    });
  }, "Profile saved");
}

/** Lets the logged-in user see which device holds their session. */
export async function currentDeviceInfo() {
  const s = await getSessionState();
  if (s.status !== "active") return null;
  const row = await db.session.findUnique({ where: { id: s.sessionId } });
  return row ? { device: row.device, since: row.createdAt.toISOString() } : null;
}

