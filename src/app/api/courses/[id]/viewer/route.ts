import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export type CourseViewerState = {
  state: "guest" | "staff" | "approved" | "pending" | "rejected" | "none";
  prereqOk: boolean;
};

/** The personal part of a public course page: is this visitor enrolled, pending, staff…? */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = { "Cache-Control": "private, no-store" };
  const user = await getCurrentUser();
  if (!user) return NextResponse.json<CourseViewerState>({ state: "guest", prereqOk: true }, { headers });
  if (isStaff(user)) return NextResponse.json<CourseViewerState>({ state: "staff", prereqOk: true }, { headers });

  const course = await db.course.findUnique({ where: { id }, select: { prerequisiteId: true } });
  const [enrollment, prereq] = await Promise.all([
    db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: id } }, select: { status: true } }),
    course?.prerequisiteId
      ? db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: course.prerequisiteId } }, select: { status: true } })
      : null,
  ]);
  const state = enrollment?.status === "APPROVED" ? "approved" : enrollment?.status === "PENDING" ? "pending" : enrollment?.status === "REJECTED" ? "rejected" : "none";
  return NextResponse.json<CourseViewerState>({ state, prereqOk: !course?.prerequisiteId || prereq?.status === "APPROVED" }, { headers });
}
