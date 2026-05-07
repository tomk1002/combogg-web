import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, notFound, unauthorized, tooManyRequests, serverError } from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";
import { verifyDesktopToken } from "@/lib/desktop-token";
import { createNotification } from "@/lib/notifications";
import { NextResponse } from "next/server";

interface Ctx { params: Promise<{ id: string }> }

async function resolveUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    return verifyDesktopToken(auth.slice(7));
  }
  const session = await getSession();
  return session?.user?.id ?? null;
}

// 콤보 라이브러리 저장 토글 — 이미 저장돼 있으면 제거, 아니면 추가
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const userId = await resolveUserId(req);
    if (!userId) return unauthorized();

    if (!rateLimit(`save:${userId}`, 30, 60_000)) return tooManyRequests();

    const combo = await prisma.combo.findUnique({
      where: { id },
      select: { id: true, status: true, authorId: true },
    });
    if (!combo || combo.status === "removed") return notFound();

    const existing = await prisma.savedCombo.findUnique({
      where: { userId_comboId: { userId, comboId: id } },
    });

    if (existing) {
      await prisma.savedCombo.delete({ where: { id: existing.id } });
      return ok({ saved: false });
    } else {
      await prisma.savedCombo.create({ data: { userId, comboId: id } });
      createNotification({ recipientId: combo.authorId, actorId: userId, type: "save", comboId: id }).catch(() => {});
      return ok({ saved: true });
    }
  } catch (err) {
    return serverError(err);
  }
}

// Explicit OPTIONS handler for Overwolf preflight requests.
export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
