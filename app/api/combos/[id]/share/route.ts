import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, notFound, unauthorized, tooManyRequests, serverError } from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";
import { createNotification } from "@/lib/notifications";

interface Ctx { params: Promise<{ id: string }> }

const SHARE_DEDUPE_WINDOW_MS = 60 * 60 * 1000;

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();

    const userId = session.user.id;
    if (!rateLimit(`share:${userId}`, 30, 60_000)) return tooManyRequests();

    const combo = await prisma.combo.findUnique({
      where: { id },
      select: { id: true, status: true, authorId: true },
    });
    if (!combo || combo.status === "removed") return notFound();

    await createNotification({
      recipientId: combo.authorId,
      actorId: userId,
      type: "share",
      comboId: id,
      dedupeWindowMs: SHARE_DEDUPE_WINDOW_MS,
    });

    return ok({ ok: true });
  } catch (err) {
    return serverError(err);
  }
}
