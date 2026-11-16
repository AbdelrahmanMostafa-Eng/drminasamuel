import { NextResponse } from "next/server";
import { getSessionState, SESSION_COOKIE } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** Heartbeat used by the one-device guard. */
export async function GET() {
  const s = await getSessionState();
  if (s.status === "active") return NextResponse.json({ active: true });
  const res = NextResponse.json({ active: false, reason: s.status === "revoked" ? s.reason : "NONE" }, { status: 401 });
  if (s.status === "revoked") res.cookies.delete(SESSION_COOKIE);
  return res;
}
