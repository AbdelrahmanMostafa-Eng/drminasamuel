import "server-only";
import { db } from "./db";

export async function audit(actor: { id: string; fullName: string } | null, action: string, details?: string) {
  try {
    await db.auditLog.create({
      data: { actorId: actor?.id ?? null, actorName: actor?.fullName ?? "System", action, details },
    });
  } catch (e) {
    console.error("audit failed", e);
  }
}

export async function notifyUsers(userIds: string[], n: { title: string; body?: string; link?: string }) {
  if (!userIds.length) return;
  await db.notification.createMany({
    data: userIds.map((userId) => ({ userId, title: n.title, body: n.body, link: n.link })),
  });
}

export async function notifyCourseStudents(courseId: string, n: { title: string; body?: string; link?: string }) {
  const rows = await db.enrollment.findMany({ where: { courseId, status: "APPROVED" }, select: { userId: true } });
  await notifyUsers(
    rows.map((r) => r.userId),
    n,
  );
}

export async function notifyStaff(perm: string, n: { title: string; body?: string; link?: string }) {
  const staff = await db.user.findMany({
    where: { isActive: true, OR: [{ role: "MASTER" }, { role: "ASSISTANT", permissions: { has: perm } }] },
    select: { id: true },
  });
  await notifyUsers(
    staff.map((s) => s.id),
    n,
  );
}
