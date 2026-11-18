import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Who is looking at the public website. The public pages are cached and shared by
 * everyone, so the header asks for the signed-in user from the browser instead.
 */
export async function GET() {
  const user = await getCurrentUser();
  return NextResponse.json(
    { user: user ? { name: user.fullName, role: user.role } : null },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
