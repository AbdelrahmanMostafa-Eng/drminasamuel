import "server-only";
import { db } from "./db";
import { fileUrl } from "./utils";
import type { StudentRow } from "@/components/admin/students-table";

export async function studentRows(courseId?: string): Promise<StudentRow[]> {
  const users = await db.user.findMany({
    where: { role: "STUDENT", ...(courseId ? { enrollments: { some: { courseId } } } : {}) },
    orderBy: { fullName: "asc" },
    include: { enrollments: { include: { course: { select: { title: true } } } } },
  });
  return users.map((u) => ({
    id: u.id,
    name: u.fullName,
    whatsapp: u.whatsapp,
    email: u.email,
    avatar: fileUrl(u.avatarKey),
    isActive: u.isActive,
    isSample: u.isSample,
    lastLogin: u.lastLoginAt?.toISOString() ?? null,
    createdAt: u.createdAt.toISOString(),
    enrollments: u.enrollments.map((e) => ({ courseId: e.courseId, course: e.course.title, status: e.status })),
  }));
}
