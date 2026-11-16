import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user || !(can(user, "students") || can(user, "payments"))) return new NextResponse("Not allowed", { status: 403 });
  const courseId = req.nextUrl.searchParams.get("courseId");
  const rows = await db.enrollment.findMany({
    where: courseId ? { courseId } : {},
    include: { user: true, course: { select: { title: true } } },
    orderBy: [{ course: { title: "asc" } }, { user: { fullName: "asc" } }],
  });
  const header = ["Full name", "WhatsApp", "Email", "Parent phone", "School", "Course", "Status", "Amount (EGP)", "Method", "Submitted"];
  const lines = rows.map((r) =>
    [r.user.fullName, r.user.whatsapp, r.user.email, r.user.parentPhone, r.user.school, r.course.title, r.status, r.amount, r.method === "INSTAPAY" ? "InstaPay" : "Vodafone Cash", r.submittedAt.toISOString()].map(esc).join(","),
  );
  const csv = "﻿" + [header.join(","), ...lines].join("\n");
  return new NextResponse(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="bioacademy-students${courseId ? "-course" : ""}.csv"` },
  });
}
