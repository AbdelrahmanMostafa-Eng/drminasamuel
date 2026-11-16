import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type UploadPurpose = "cover" | "course-file" | "payment-proof" | "avatar" | "question-image";

const DRIVER = (process.env.STORAGE_DRIVER ?? "local") as "local" | "s3";
const LOCAL_DIR = path.resolve(process.env.LOCAL_STORAGE_DIR ?? "./storage");
const SECRET = process.env.APP_SECRET ?? "dev-secret";

export const storageDriver = DRIVER;

let _s3: S3Client | null = null;
function s3() {
  if (!_s3) {
    _s3 = new S3Client({
      region: process.env.S3_REGION || "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      forcePathStyle: !!process.env.S3_FORCE_PATH_STYLE,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
      },
    });
  }
  return _s3;
}
const BUCKET = process.env.S3_BUCKET ?? "bioacademy";

export const MIME_BY_EXT: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  svg: "image/svg+xml",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  m4v: "video/x-m4v",
  mp3: "audio/mpeg",
  m4a: "audio/mp4",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
  txt: "text/plain",
};

export function mimeFromKey(key: string) {
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

function safeName(filename: string) {
  const ext = (filename.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  const base =
    filename
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "file";
  return { base, ext };
}

export function buildKey(purpose: UploadPurpose, filename: string, ctx: { courseId?: string; userId: string }) {
  const { base, ext } = safeName(filename);
  const rand = randomBytes(6).toString("hex");
  switch (purpose) {
    case "cover":
      return `public/covers/${rand}-${base}.${ext}`;
    case "avatar":
      return `public/avatars/${ctx.userId}-${rand}.${ext}`;
    case "payment-proof":
      return `payments/${ctx.userId}/${Date.now()}-${rand}.${ext}`;
    case "question-image":
      return `courses/${ctx.courseId}/questions/${rand}.${ext}`;
    case "course-file":
      return `courses/${ctx.courseId}/files/${rand}-${base}.${ext}`;
  }
}

function sign(payload: string) {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function createLocalUploadToken(data: { key: string; max: number }) {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + 3600_000 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyLocalUploadToken(token: string): { key: string; max: number } | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as { key: string; max: number; exp: number };
  if (data.exp < Date.now()) return null;
  return data;
}

/** Where the browser should PUT the file. */
export async function getUploadTarget(key: string, contentType: string, maxBytes: number) {
  if (DRIVER === "s3") {
    const url = await getSignedUrl(s3(), new PutObjectCommand({ Bucket: BUCKET, Key: key, ContentType: contentType }), {
      expiresIn: 3600,
    });
    return { url, headers: { "Content-Type": contentType } as Record<string, string> };
  }
  const token = createLocalUploadToken({ key, max: maxBytes });
  return { url: `/api/upload/local?token=${encodeURIComponent(token)}`, headers: { "Content-Type": contentType } };
}

export function localPath(key: string) {
  const p = path.resolve(LOCAL_DIR, key);
  if (!p.startsWith(LOCAL_DIR + path.sep)) throw new Error("Invalid key");
  return p;
}

export async function putBuffer(key: string, body: Buffer, contentType?: string) {
  if (DRIVER === "s3") {
    await s3().send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType ?? mimeFromKey(key) }));
    return;
  }
  const p = localPath(key);
  await fs.promises.mkdir(path.dirname(p), { recursive: true });
  await fs.promises.writeFile(p, body);
}

export async function deleteObject(key: string | null | undefined) {
  if (!key) return;
  try {
    if (DRIVER === "s3") await s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    else await fs.promises.unlink(localPath(key));
  } catch {
    /* already gone */
  }
}

export async function getSignedDownloadUrl(key: string, opts: { download?: boolean; filename?: string } = {}) {
  const disposition = `${opts.download ? "attachment" : "inline"}${opts.filename ? `; filename="${opts.filename.replace(/"/g, "")}"` : ""}`;
  return getSignedUrl(
    s3(),
    new GetObjectCommand({ Bucket: BUCKET, Key: key, ResponseContentDisposition: disposition, ResponseContentType: mimeFromKey(key) }),
    { expiresIn: 60 * 20 },
  );
}
