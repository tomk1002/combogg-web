import { auth } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/api/response";
import { signDesktopToken } from "@/lib/desktop-token";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const token = await signDesktopToken(session.user.id);
  return ok({ token });
}

// Explicit OPTIONS handler so Overwolf's preflight requests get a 204 response
// with CORS headers (set globally in next.config.ts).
export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
