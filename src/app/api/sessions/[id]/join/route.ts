import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isStaff } from "@/lib/permissions";
import { sessionPhase } from "@/lib/access";
import { ensureUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Click-to-attend: marks the student PRESENT, then redirects to Zoom.
 * The Zoom link itself is never rendered on the student's page.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const back = (msg: string) => NextResponse.redirect(new URL(`/dashboard/schedule?notice=${encodeURIComponent(msg)}`, req.url));
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL(`/login?next=/dashboard/schedule`, req.url));

  const session = await db.liveSession.findUnique({ where: { id } });
  if (!session) return back("Session not found.");

  if (isStaff(user)) return NextResponse.redirect(ensureUrl(session.zoomUrl));

  const enrollment = await db.enrollment.findUnique({ where: { userId_courseId: { userId: user.id, courseId: session.courseId } } });
  if (enrollment?.status !== "APPROVED") return back("You need an approved enrollment to join this session.");

  const phase = sessionPhase(session);
  if (phase === "upcoming") return back("This session hasn't opened yet. The Join button unlocks shortly before it starts.");
  if (phase === "ended") return back("This session has already ended.");

  const now = new Date();
  await db.attendance.upsert({
    where: { sessionId_userId: { sessionId: id, userId: user.id } },
    create: { sessionId: id, userId: user.id, joinedAt: now, joinCount: 1 },
    update: { joinCount: { increment: 1 } },
  });
  // keep first join time
  await db.attendance.updateMany({ where: { sessionId: id, userId: user.id, joinedAt: null }, data: { joinedAt: now } });

  return NextResponse.redirect(ensureUrl(session.zoomUrl));
}
