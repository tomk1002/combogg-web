import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { prisma } from "@/lib/db";

const NonceSchema = z.string().uuid();

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const ONE_HOUR_MS = 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  try {
    const nonce = req.nextUrl.searchParams.get("nonce");
    const parsed = NonceSchema.safeParse(nonce);
    if (!parsed.success) return badRequest("nonce 형식이 올바르지 않습니다");

    // Best-effort cleanup of stale records (>1h). Don't block the response on
    // failures.
    const cutoff = new Date(Date.now() - ONE_HOUR_MS);
    prisma.desktopLoginNonce
      .deleteMany({ where: { createdAt: { lt: cutoff } } })
      .catch(() => {
        /* ignore — best-effort */
      });

    const record = await prisma.desktopLoginNonce.findUnique({
      where: { nonce: parsed.data },
    });

    if (!record) {
      return ok({ status: "pending" as const });
    }

    const ageMs = Date.now() - record.createdAt.getTime();

    if (ageMs > FIVE_MINUTES_MS) {
      // Stale — clean up and report expired
      await prisma.desktopLoginNonce
        .delete({ where: { nonce: parsed.data } })
        .catch(() => {
          /* ignore — already deleted */
        });
      return ok({ status: "expired" as const });
    }

    if (!record.token) {
      return ok({ status: "pending" as const });
    }

    // One-time use: delete after returning the token
    const token = record.token;
    await prisma.desktopLoginNonce
      .delete({ where: { nonce: parsed.data } })
      .catch(() => {
        /* ignore — concurrent poll may have already consumed it */
      });

    return ok({ status: "ready" as const, token });
  } catch (err) {
    return serverError(err);
  }
}

// Explicit OPTIONS handler so Overwolf's preflight requests get a 204 response
// with CORS headers (set globally in next.config.ts).
export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
