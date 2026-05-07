import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, badRequest, unauthorized, serverError, notFound } from "@/lib/api/response";

const VALID_TYPES = new Set(["combo", "comment"]);

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("body가 필요합니다");

    const { targetType, targetId, reason } = body as {
      targetType?: string;
      targetId?: string;
      reason?: string;
    };
    if (!targetType || !VALID_TYPES.has(targetType)) {
      return badRequest("targetType은 'combo' 또는 'comment'여야 합니다");
    }
    if (!targetId || typeof targetId !== "string") {
      return badRequest("targetId가 필요합니다");
    }
    const trimmedReason = typeof reason === "string" ? reason.trim().slice(0, 1000) : null;

    // Validate target exists.
    if (targetType === "combo") {
      const c = await prisma.combo.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!c) return notFound();
    } else {
      const c = await prisma.comment.findUnique({ where: { id: targetId }, select: { id: true } });
      if (!c) return notFound();
    }

    const report = await prisma.report.create({
      data: {
        reporterId: session.user.id,
        targetType,
        targetId,
        reason: trimmedReason || null,
      },
      select: { id: true, status: true, createdAt: true },
    });

    return ok(report, 201);
  } catch (err) {
    return serverError(err);
  }
}
