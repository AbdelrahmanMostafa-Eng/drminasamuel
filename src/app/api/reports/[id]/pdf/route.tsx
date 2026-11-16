import { NextResponse, type NextRequest } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { AttendancePdf, GradesPdf, CourseSummaryPdf } from "@/lib/pdf/report-document";
import type { AttendanceReportData, GradesReportData, CourseSummaryData } from "@/lib/reports";
import { slugify } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !can(user, "reports")) return new NextResponse("Not allowed", { status: 403 });
  const { id } = await ctx.params;
  const report = await db.report.findUnique({ where: { id } });
  if (!report) return new NextResponse("Not found", { status: 404 });

  const meta = {
    courseTitle: report.courseTitle,
    generatedAt: report.createdAt.toISOString(),
    generatedBy: report.generatedByName ?? "Bioacademy",
  };
  const data = report.data as unknown;
  const doc =
    report.type === "ATTENDANCE" ? (
      <AttendancePdf data={data as AttendanceReportData} meta={meta} />
    ) : report.type === "GRADES" ? (
      <GradesPdf data={data as GradesReportData} meta={meta} />
    ) : (
      <CourseSummaryPdf data={data as CourseSummaryData} meta={meta} />
    );
  const buffer = await renderToBuffer(doc);
  const filename = `${slugify(report.title) || "report"}.pdf`;
  const inline = req.nextUrl.searchParams.get("inline") === "1";
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
