"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { ActionError, actionMaster, actionStaff, generatePassword, hashPassword, revokeAllSessions, run } from "@/lib/auth";
import { audit, notifyUsers } from "@/lib/audit";
import { ALL_PERMISSIONS } from "@/lib/permissions";
import { normalizePhone } from "@/lib/utils";
import { deleteObject } from "@/lib/storage";

// ─── Payments / enrollment review ──────────────────────────────────

export async function reviewEnrollmentAction(id: string, decision: "APPROVE" | "REJECT", reason?: string) {
  return run(async () => {
    const me = await actionStaff("payments");
    const e = await db.enrollment.findUniqueOrThrow({ where: { id }, include: { course: true, user: true } });
    if (decision === "REJECT" && !reason?.trim()) throw new ActionError("Please write a reason so the student knows what to fix.");
    await db.enrollment.update({
      where: { id },
      data: {
        status: decision === "APPROVE" ? "APPROVED" : "REJECTED",
        rejectionReason: decision === "REJECT" ? reason!.trim() : null,
        reviewedById: me.id,
        reviewedAt: new Date(),
      },
    });
    await notifyUsers([e.userId], {
      title: decision === "APPROVE" ? `You're in! ${e.course.title} is unlocked 🎉` : `Payment not approved — ${e.course.title}`,
      body: decision === "APPROVE" ? "Open the course and join the WhatsApp group." : `Reason: ${reason}`,
      link: decision === "APPROVE" ? `/dashboard/courses/${e.courseId}` : `/dashboard/enroll/${e.courseId}`,
    });
    await audit(me, decision === "APPROVE" ? "enrollment.approved" : "enrollment.rejected", `${e.user.fullName} — ${e.course.title}${reason ? ` (${reason})` : ""}`);
    revalidatePath("/admin", "layout");
  }, decision === "APPROVE" ? "Enrollment approved" : "Payment rejected");
}

// ─── Students ──────────────────────────────────────────────────────

const usernameField = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,30}$/, "Username: 3–30 letters, numbers, dots, dashes or underscores (no spaces).")
  .optional()
  .or(z.literal(""));

const studentSchema = z.object({
  fullName: z.string().trim().min(3, "Enter the full name.").max(80),
  whatsapp: z.string().trim().min(8, "Enter a WhatsApp number."),
  email: z.string().trim().toLowerCase().email("Invalid email.").optional().or(z.literal("")),
  parentPhone: z.string().trim().min(8, "Enter the parent's phone number."),
  username: usernameField,
  password: z.string().max(100).optional().or(z.literal("")),
  mustChangePassword: z.boolean().optional(),
  courseId: z.string().optional().nullable(),
  amount: z.coerce.number().int().min(0).optional(),
});

/** Adds a student by hand (e.g. paid cash at a center). Returns the temporary password. */
export async function createStudentAction(input: z.input<typeof studentSchema>) {
  return run(async () => {
    const me = await actionStaff("students");
    const d = studentSchema.parse(input);
    const whatsapp = normalizePhone(d.whatsapp);
    if (!whatsapp) throw new ActionError("Invalid WhatsApp number.");
    const parentPhone = normalizePhone(d.parentPhone);
    if (!parentPhone) throw new ActionError("Parent's number looks invalid.");
    const dup = await db.user.findFirst({ where: { OR: [{ whatsapp }, ...(d.email ? [{ email: d.email }] : [])] } });
    if (dup) throw new ActionError("A user with this WhatsApp number or email already exists.");
    const username = d.username || null;
    if (username && (await db.user.findUnique({ where: { username } }))) throw new ActionError("That username is taken — try another.");
    const chosen = d.password?.trim() ?? "";
    if (chosen && chosen.length < 8) throw new ActionError("Password must be at least 8 characters.");
    const temp = chosen || generatePassword(10);
    const user = await db.user.create({
      data: {
        role: "STUDENT",
        fullName: d.fullName,
        whatsapp,
        username,
        email: d.email || null,
        parentPhone,
        passwordHash: await hashPassword(temp),
        // A password the teacher chose is kept unless asked otherwise; a generated one must be changed.
        mustChangePassword: chosen ? !!d.mustChangePassword : true,
      },
    });
    if (d.courseId) {
      const course = await db.course.findUniqueOrThrow({ where: { id: d.courseId } });
      await db.enrollment.create({
        data: { userId: user.id, courseId: course.id, status: "APPROVED", method: "VODAFONE_CASH", amount: d.amount ?? course.price, proofKey: "manual", note: `Added manually by ${me.fullName}`, reviewedById: me.id, reviewedAt: new Date() },
      });
    }
    await audit(me, "student.created_manually", `${d.fullName} (${whatsapp})`);
    revalidatePath("/admin/students");
    return { password: temp, login: username ?? whatsapp, whatsapp, temporary: !chosen || !!d.mustChangePassword };
  });
}

export async function manualEnrollAction(userId: string, courseId: string, amount?: number) {
  return run(async () => {
    const me = await actionStaff("payments");
    const course = await db.course.findUniqueOrThrow({ where: { id: courseId } });
    await db.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      create: { userId, courseId, status: "APPROVED", method: "VODAFONE_CASH", amount: amount ?? course.price, proofKey: "manual", note: `Added manually by ${me.fullName}`, reviewedById: me.id, reviewedAt: new Date() },
      update: { status: "APPROVED", reviewedById: me.id, reviewedAt: new Date(), rejectionReason: null },
    });
    await notifyUsers([userId], { title: `You're in! ${course.title} is unlocked 🎉`, link: `/dashboard/courses/${courseId}` });
    await audit(me, "enrollment.manual", course.title);
    revalidatePath("/admin", "layout");
  }, "Student enrolled");
}

export async function removeEnrollmentAction(enrollmentId: string) {
  return run(async () => {
    const me = await actionStaff("students");
    const e = await db.enrollment.findUniqueOrThrow({ where: { id: enrollmentId }, include: { user: true, course: true } });
    if (e.proofKey !== "manual") await deleteObject(e.proofKey);
    await db.enrollment.delete({ where: { id: enrollmentId } });
    await audit(me, "enrollment.removed", `${e.user.fullName} — ${e.course.title}`);
    revalidatePath("/admin", "layout");
  }, "Removed from course");
}

export async function resetPasswordAction(userId: string) {
  return run(async () => {
    const me = await actionStaff("students");
    const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
    if (u.role !== "STUDENT" && me.role !== "MASTER") throw new ActionError("Only the master admin can reset staff passwords.");
    if (u.role === "MASTER") throw new ActionError("The master password can only be changed from the master's own profile.");
    const temp = generatePassword(10);
    await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(temp), mustChangePassword: true } });
    await revokeAllSessions(userId, "PASSWORD_CHANGED");
    await audit(me, "user.password_reset", u.fullName);
    return temp;
  });
}

/** Lets staff choose a student's password (e.g. for students who can't manage their own account). */
export async function setStudentPasswordAction(userId: string, password: string, mustChange: boolean) {
  return run(async () => {
    const me = await actionStaff("students");
    const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
    if (u.role !== "STUDENT") throw new ActionError("Use Team & permissions for staff passwords.");
    if (password.length < 8) throw new ActionError("Password must be at least 8 characters.");
    await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(password), mustChangePassword: mustChange } });
    await revokeAllSessions(userId, "PASSWORD_CHANGED");
    await audit(me, "user.password_set", u.fullName);
  }, "Password updated");
}

export async function forceLogoutAction(userId: string) {
  return run(async () => {
    const me = await actionStaff("students");
    const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
    if (u.role === "MASTER") throw new ActionError("Not allowed.");
    await revokeAllSessions(userId, "ADMIN");
    await audit(me, "user.device_reset", u.fullName);
    revalidatePath(`/admin/students/${userId}`);
  }, "Signed out from all devices");
}

export async function setUserActiveAction(userId: string, active: boolean) {
  return run(async () => {
    const me = await actionStaff("students");
    const u = await db.user.findUniqueOrThrow({ where: { id: userId } });
    if (u.role === "MASTER") throw new ActionError("Not allowed.");
    if (u.role === "ASSISTANT" && me.role !== "MASTER") throw new ActionError("Only the master admin can suspend assistants.");
    await db.user.update({ where: { id: userId }, data: { isActive: active } });
    if (!active) await revokeAllSessions(userId, "SUSPENDED");
    await audit(me, active ? "user.activated" : "user.suspended", u.fullName);
    revalidatePath("/admin", "layout");
  }, active ? "Account activated" : "Account suspended");
}

export async function updateStudentAction(userId: string, input: { fullName: string; whatsapp: string; email?: string; parentPhone?: string; username?: string }) {
  return run(async () => {
    const me = await actionStaff("students");
    const whatsapp = normalizePhone(input.whatsapp);
    if (!whatsapp) throw new ActionError("Invalid WhatsApp number.");
    const email = input.email?.trim().toLowerCase() || null;
    const parsedUsername = usernameField.safeParse(input.username ?? "");
    if (!parsedUsername.success) throw new ActionError(parsedUsername.error.issues[0]?.message ?? "Invalid username.");
    const username = parsedUsername.data || null;
    const parentPhone = input.parentPhone ? normalizePhone(input.parentPhone) : null;
    if (!parentPhone) throw new ActionError("Enter a valid parent's phone number.");
    const dup = await db.user.findFirst({ where: { NOT: { id: userId }, OR: [{ whatsapp }, ...(email ? [{ email }] : []), ...(username ? [{ username }] : [])] } });
    if (dup) throw new ActionError(username && dup.username === username ? "That username is taken — try another." : "Another account already uses this number or email.");
    await db.user.update({
      where: { id: userId },
      data: { fullName: input.fullName.trim(), whatsapp, email, username, parentPhone },
    });
    await audit(me, "student.updated", input.fullName);
    revalidatePath(`/admin/students/${userId}`);
  }, "Student updated");
}

export async function deleteStudentAction(userId: string) {
  return run(async () => {
    const me = await actionStaff("students");
    const u = await db.user.findUniqueOrThrow({ where: { id: userId }, include: { enrollments: true } });
    if (u.role !== "STUDENT") throw new ActionError("Only student accounts can be deleted here.");
    for (const e of u.enrollments) if (e.proofKey !== "manual") await deleteObject(e.proofKey);
    await db.user.delete({ where: { id: userId } });
    await audit(me, "student.deleted", u.fullName);
    revalidatePath("/admin/students");
  }, "Student account deleted");
}

// ─── Assistants (master only) ──────────────────────────────────────

const assistantSchema = z.object({
  fullName: z.string().trim().min(2, "Enter a name.").max(80),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(30)
    .regex(/^[a-z0-9._-]+$/, "Use only letters, numbers, dots, dashes or underscores."),
  password: z.string().min(8, "Password must be at least 8 characters.").optional().or(z.literal("")),
  whatsapp: z.string().trim().optional(),
  permissions: z.array(z.enum(ALL_PERMISSIONS as [string, ...string[]])).default([]),
});

export async function createAssistantAction(input: z.input<typeof assistantSchema>) {
  return run(async () => {
    const me = await actionMaster();
    const d = assistantSchema.parse(input);
    if (await db.user.findUnique({ where: { username: d.username } })) throw new ActionError("That username is taken.");
    const password = d.password || generatePassword(10);
    const whatsapp = d.whatsapp ? normalizePhone(d.whatsapp) : null;
    if (whatsapp && (await db.user.findUnique({ where: { whatsapp } }))) throw new ActionError("This WhatsApp number is already used by another account.");
    await db.user.create({
      data: { role: "ASSISTANT", fullName: d.fullName, username: d.username, whatsapp, passwordHash: await hashPassword(password), permissions: d.permissions },
    });
    await audit(me, "assistant.created", `${d.fullName} (@${d.username})`);
    revalidatePath("/admin/team");
    return { username: d.username, password };
  });
}

export async function updateAssistantAction(id: string, input: { fullName: string; permissions: string[]; whatsapp?: string }) {
  return run(async () => {
    const me = await actionMaster();
    const perms = input.permissions.filter((p) => (ALL_PERMISSIONS as string[]).includes(p));
    const u = await db.user.findUniqueOrThrow({ where: { id } });
    if (u.role !== "ASSISTANT") throw new ActionError("Not an assistant.");
    await db.user.update({ where: { id }, data: { fullName: input.fullName.trim() || u.fullName, permissions: perms, whatsapp: input.whatsapp ? normalizePhone(input.whatsapp) : u.whatsapp } });
    await audit(me, "assistant.permissions", `${u.fullName}: ${perms.join(", ") || "none"}`);
    revalidatePath("/admin/team");
  }, "Assistant updated");
}

export async function setAssistantPasswordAction(id: string, password: string) {
  return run(async () => {
    const me = await actionMaster();
    if (password.length < 8) throw new ActionError("Password must be at least 8 characters.");
    const u = await db.user.findUniqueOrThrow({ where: { id } });
    if (u.role !== "ASSISTANT") throw new ActionError("Not an assistant.");
    await db.user.update({ where: { id }, data: { passwordHash: await hashPassword(password), mustChangePassword: false } });
    await revokeAllSessions(id, "PASSWORD_CHANGED");
    await audit(me, "assistant.password_set", u.fullName);
  }, "Password updated");
}

export async function deleteAssistantAction(id: string) {
  return run(async () => {
    const me = await actionMaster();
    const u = await db.user.findUniqueOrThrow({ where: { id } });
    if (u.role !== "ASSISTANT") throw new ActionError("Not an assistant.");
    await db.user.delete({ where: { id } });
    await audit(me, "assistant.deleted", u.fullName);
    revalidatePath("/admin/team");
  }, "Assistant removed");
}
