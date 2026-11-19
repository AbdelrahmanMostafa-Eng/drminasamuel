import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { buildKey, getUploadTarget, storageDriver, type UploadPurpose } from "@/lib/storage";

export const dynamic = "force-dynamic";

const MB = 1024 * 1024;
const schema = z.object({
  purpose: z.enum(["cover", "course-file", "payment-proof", "avatar", "question-image"]),
  filename: z.string().min(1).max(200),
  contentType: z.string().max(120).default("application/octet-stream"),
  size: z.number().int().positive(),
  courseId: z.string().optional(),
});

const IMAGE = /^image\//;

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload request." }, { status: 400 });
  const { purpose, filename, contentType, size, courseId } = parsed.data;

  const rules: Record<UploadPurpose, { ok: boolean; max: number; type?: RegExp; needsCourse?: boolean }> = {
    "payment-proof": { ok: user.role === "STUDENT", max: 10 * MB, type: /^(image\/|application\/pdf)/ },
    avatar: { ok: true, max: 5 * MB, type: IMAGE },
    cover: { ok: can(user, "courses") || can(user, "content") || user.role === "MASTER", max: 8 * MB, type: IMAGE },
    "question-image": { ok: can(user, "assessments"), max: 8 * MB, type: IMAGE, needsCourse: true },
    // Without S3/R2 on Vercel, files go into the database — keep them small (use video links for videos).
    "course-file": { ok: can(user, "content"), max: (storageDriver === "s3" ? 5000 : storageDriver === "db" ? 60 : 2000) * MB, needsCourse: true },
  };
  const rule = rules[purpose];
  if (!rule.ok) return NextResponse.json({ error: "You don't have permission to upload this." }, { status: 403 });
  if (rule.type && !rule.type.test(contentType)) return NextResponse.json({ error: "This file type isn't allowed here." }, { status: 400 });
  if (size > rule.max)
    return NextResponse.json(
      {
        error:
          storageDriver === "db" && purpose === "course-file"
            ? `File is too large (max ${Math.round(rule.max / MB)} MB until cloud storage is connected). For videos, add a YouTube, Vimeo or Google Drive link instead.`
            : `File is too large (max ${Math.round(rule.max / MB)} MB).`,
      },
      { status: 400 },
    );
  if (rule.needsCourse && !courseId) return NextResponse.json({ error: "Missing course." }, { status: 400 });

  const key = buildKey(purpose, filename, { courseId, userId: user.id });
  const target = await getUploadTarget(key, contentType, rule.max);
  return NextResponse.json({ key, ...target });
}
