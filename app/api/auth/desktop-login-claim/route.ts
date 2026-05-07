import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { ok, badRequest, unauthorized, serverError } from "@/lib/api/response";
import { signDesktopToken } from "@/lib/desktop-token";
import { prisma } from "@/lib/db";

const ClaimSchema = z.object({
  nonce: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return unauthorized();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return badRequest("잘못된 요청 본문");
    }

    const parsed = ClaimSchema.safeParse(body);
    if (!parsed.success) return badRequest("nonce 형식이 올바르지 않습니다");

    const { nonce } = parsed.data;
    const userId = session.user.id;

    const token = await signDesktopToken(userId);

    await prisma.desktopLoginNonce.upsert({
      where: { nonce },
      create: { nonce, userId, token, createdAt: new Date() },
      update: { userId, token, createdAt: new Date() },
    });

    return ok({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}

// Explicit OPTIONS handler so Overwolf's preflight requests get a 204 response
// with CORS headers (set globally in next.config.ts).
export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
