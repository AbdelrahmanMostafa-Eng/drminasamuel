import fs from "node:fs";
import path from "node:path";
import { NextResponse, type NextRequest } from "next/server";
import { localPath, verifyLocalUploadToken } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

/** Receives a browser PUT for the "local" storage driver (VPS / Docker / dev). */
export async function PUT(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const t = verifyLocalUploadToken(token);
  if (!t) return NextResponse.json({ error: "Upload link expired. Please try again." }, { status: 403 });
  if (!req.body) return NextResponse.json({ error: "Empty upload." }, { status: 400 });

  const file = localPath(t.key);
  await fs.promises.mkdir(path.dirname(file), { recursive: true });
  const tmp = file + ".part";
  const out = fs.createWriteStream(tmp);
  let size = 0;
  const reader = req.body.getReader();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > t.max) throw new Error("too-large");
      if (!out.write(value)) await new Promise((r) => out.once("drain", r));
    }
    await new Promise<void>((resolve, reject) => out.end((err?: Error | null) => (err ? reject(err) : resolve())));
    await fs.promises.rename(tmp, file);
  } catch (e) {
    out.destroy();
    await fs.promises.unlink(tmp).catch(() => {});
    const msg = e instanceof Error && e.message === "too-large" ? "File is too large." : "Upload failed.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
  return NextResponse.json({ ok: true, key: t.key, size });
}
