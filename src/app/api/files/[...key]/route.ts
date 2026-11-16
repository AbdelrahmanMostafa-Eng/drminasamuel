import fs from "node:fs";
import { Readable } from "node:stream";
import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { can, isStaff } from "@/lib/permissions";
import { localPath, mimeFromKey, storageDriver, getSignedDownloadUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

async function allowed(key: string) {
  if (key.startsWith("public/")) return true;
  const user = await getCurrentUser();
  if (!user) return false;
  const parts = key.split("/");
  if (parts[0] === "payments") {
    return parts[1] === user.id || can(user, "payments") || can(user, "students");
  }
  if (parts[0] === "courses") {
    if (isStaff(user)) return true;
    const courseId = parts[1]!;
    const e = await db.enrollment.findUnique({
      where: { userId_courseId: { userId: user.id, courseId } },
      include: { course: { select: { status: true } } },
    });
    return e?.status === "APPROVED" && (e.course.status === "PUBLISHED" || e.course.status === "ENDED");
  }
  return false;
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: parts } = await ctx.params;
  const key = parts.map(decodeURIComponent).join("/");
  if (key.includes("..")) return new NextResponse("Bad request", { status: 400 });
  if (!(await allowed(key))) return new NextResponse("Not allowed", { status: 403 });

  const download = req.nextUrl.searchParams.get("download") === "1";
  const name = req.nextUrl.searchParams.get("name") ?? key.split("/").pop()!;
  const isPublic = key.startsWith("public/");

  if (storageDriver === "s3") {
    const url = await getSignedDownloadUrl(key, { download, filename: name });
    return NextResponse.redirect(url, { status: 302, headers: { "Cache-Control": "private, max-age=600" } });
  }

  let file: string;
  try {
    file = localPath(key);
  } catch {
    return new NextResponse("Bad request", { status: 400 });
  }
  let stat: fs.Stats;
  try {
    stat = await fs.promises.stat(file);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  const type = mimeFromKey(key);
  const headers: Record<string, string> = {
    "Content-Type": type,
    "Accept-Ranges": "bytes",
    "Cache-Control": isPublic ? "public, max-age=31536000, immutable" : "private, max-age=600",
    "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${name.replace(/"/g, "")}"`,
  };
  const range = req.headers.get("range");
  if (range) {
    const m = range.match(/bytes=(\d*)-(\d*)/);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 0;
      const end = m[2] ? Math.min(parseInt(m[2], 10), stat.size - 1) : stat.size - 1;
      if (start >= stat.size || start > end) {
        return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } });
      }
      const stream = fs.createReadStream(file, { start, end });
      return new NextResponse(Readable.toWeb(stream) as ReadableStream, {
        status: 206,
        headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": String(end - start + 1) },
      });
    }
  }
  const stream = fs.createReadStream(file);
  return new NextResponse(Readable.toWeb(stream) as ReadableStream, { headers: { ...headers, "Content-Length": String(stat.size) } });
}
