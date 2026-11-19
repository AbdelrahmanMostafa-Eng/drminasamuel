import "server-only";
import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { db } from "./db";

export type UploadPurpose = "cover" | "course-file" | "payment-proof" | "avatar" | "question-image";

/**
 * Where uploaded files live:
 *  - "s3":    Cloudflare R2 / AWS S3 / Supabase Storage (set STORAGE_DRIVER=s3, or just the S3_* keys)
 *  - "db":    inside the Postgres database — automatic on Vercel until S3/R2 is configured, because
 *             Vercel's disk is read-only and wiped between requests
 *  - "local": a folder on the server's disk (VPS / Docker / development)
 */
const DRIVER = (process.env.STORAGE_DRIVER ||
  (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY ? "s3" : process.env.VERCEL || process.env.VERCEL_ENV || process.env.LAMBDA_TASK_ROOT ? "db" : "local")) as "local" | "s3" | "db";
const LOCAL_DIR = path.resolve(/* turbopackIgnore: true */ process.env.LOCAL_STORAGE_DIR ?? "./storage");
/** Signs upload links. Without APP_SECRET, fall back to a value derived from the (private) database URL. */
const SECRET =
  process.env.APP_SECRET ||
  createHash("sha256")
    .update(`bioacademy-upload:${process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || "dev-secret"}`)
    .digest("hex");

/** Size of each piece when uploading to the database driver (under Vercel's 4.5 MB request limit). */
export const DB_CHUNK_SIZE = 3.5 * 1024 * 1024;

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
  return {
    url: `/api/upload/local?token=${encodeURIComponent(token)}`,
    headers: { "Content-Type": contentType } as Record<string, string>,
    ...(DRIVER === "db" ? { chunkSize: DB_CHUNK_SIZE } : {}),
  };
}

export function localPath(key: string) {
  const p = path.resolve(/* turbopackIgnore: true */ LOCAL_DIR, key);
  if (!p.startsWith(LOCAL_DIR + path.sep)) throw new Error("Invalid key");
  return p;
}

export async function putBuffer(key: string, body: Buffer, contentType?: string) {
  if (DRIVER === "db") {
    await ensureStorageTables();
    const type = contentType ?? mimeFromKey(key);
    await db.storedFile.deleteMany({ where: { key } });
    await db.storedFile.create({ data: { key, contentType: type, size: body.length, complete: false } });
    const parts = Math.max(1, Math.ceil(body.length / DB_CHUNK_SIZE));
    for (let i = 0; i < parts; i++) {
      const part = body.subarray(i * DB_CHUNK_SIZE, (i + 1) * DB_CHUNK_SIZE);
      await db.storedFileChunk.create({ data: { key, index: i, size: part.length, data: new Uint8Array(part) } });
    }
    await db.storedFile.update({ where: { key }, data: { complete: true } });
    return;
  }
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
    // Files saved while the site ran without S3 stay in the database even after S3 is switched on.
    await db.storedFile.deleteMany({ where: { key } }).catch(() => {});
    if (DRIVER === "s3") await s3().send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    else if (DRIVER === "local") await fs.promises.unlink(localPath(key));
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

/**
 * Creates the file tables if they're missing (same SQL as the migration, IF NOT EXISTS), so database
 * storage works even when a deploy couldn't run migrations. Runs once per server instance.
 */
let tablesReady: Promise<void> | null = null;
export function ensureStorageTables() {
  if (!tablesReady) {
    tablesReady = (async () => {
      await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "StoredFile" ("key" TEXT NOT NULL, "contentType" TEXT NOT NULL, "size" INTEGER NOT NULL DEFAULT 0, "complete" BOOLEAN NOT NULL DEFAULT false, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "StoredFile_pkey" PRIMARY KEY ("key"))`);
      await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "StoredFileChunk" ("key" TEXT NOT NULL, "index" INTEGER NOT NULL, "size" INTEGER NOT NULL, "data" BYTEA NOT NULL, CONSTRAINT "StoredFileChunk_pkey" PRIMARY KEY ("key","index"))`);
      await db.$executeRawUnsafe(`DO $$ BEGIN ALTER TABLE "StoredFileChunk" ADD CONSTRAINT "StoredFileChunk_key_fkey" FOREIGN KEY ("key") REFERENCES "StoredFile"("key") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    })().catch((e) => {
      tablesReady = null;
      throw e;
    });
  }
  return tablesReady;
}

/** Saves one piece of a browser upload (database driver). Returns the file size so far. */
export async function putDbChunk(key: string, contentType: string, index: number, total: number, data: Buffer, maxBytes: number) {
  await ensureStorageTables();
  if (index === 0) {
    await db.storedFile.deleteMany({ where: { key } });
    await db.storedFile.create({ data: { key, contentType, size: 0, complete: false } });
  }
  const file = await db.storedFile.findUnique({ where: { key }, select: { size: true, complete: true } });
  if (!file || file.complete) throw new Error("Upload out of order. Please try again.");
  if (file.size + data.length > maxBytes) {
    await db.storedFile.deleteMany({ where: { key } });
    throw new Error("too-large");
  }
  await db.storedFileChunk.upsert({
    where: { key_index: { key, index } },
    create: { key, index, size: data.length, data: new Uint8Array(data) },
    update: { size: data.length, data: new Uint8Array(data) },
  });
  const updated = await db.storedFile.update({
    where: { key },
    data: { size: { increment: data.length }, ...(index === total - 1 ? { complete: true } : {}) },
    select: { size: true },
  });
  return updated.size;
}

/** Reads a file kept in the database (any driver: files saved before S3 was switched on still work). */
export async function getDbFile(key: string) {
  if (DRIVER === "db") await ensureStorageTables().catch(() => {});
  return db.storedFile
    .findUnique({ where: { key }, select: { size: true, contentType: true, complete: true, chunks: { select: { index: true, size: true }, orderBy: { index: "asc" } } } })
    .catch(() => null);
}

/** Streams bytes [start, end] of a database-stored file, loading one piece at a time. */
export function streamDbFile(key: string, chunks: { index: number; size: number }[], start: number, end: number) {
  let offset = 0;
  const plan: { index: number; from: number; to: number }[] = [];
  for (const c of chunks) {
    const cStart = offset;
    const cEnd = offset + c.size - 1;
    if (cEnd >= start && cStart <= end) plan.push({ index: c.index, from: Math.max(0, start - cStart), to: Math.min(c.size - 1, end - cStart) });
    offset += c.size;
  }
  let i = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (i >= plan.length) return controller.close();
      const p = plan[i++]!;
      const row = await db.storedFileChunk.findUnique({ where: { key_index: { key, index: p.index } }, select: { data: true } });
      if (!row) return controller.error(new Error("Missing file piece"));
      controller.enqueue(new Uint8Array(row.data.subarray(p.from, p.to + 1)));
    },
  });
}
