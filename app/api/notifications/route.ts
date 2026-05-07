import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, unauthorized, serverError } from "@/lib/api/response";
import type { NotificationDTO, NotificationListDTO } from "@/lib/api/types";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();
    const userId = session.user.id;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "20")));

    const [rows, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { recipientId: userId },
        include: {
          actor: { select: { id: true, nickname: true, avatarUrl: true } },
          combo: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.notification.count({ where: { recipientId: userId, readAt: null } }),
    ]);

    const items: NotificationDTO[] = rows.map((n) => ({
      id: n.id,
      type: n.type,
      actor: { id: n.actor.id, nickname: n.actor.nickname, avatarUrl: n.actor.avatarUrl },
      combo: { id: n.combo.id, title: n.combo.title },
      commentId: n.commentId,
      readAt: n.readAt?.toISOString() ?? null,
      createdAt: n.createdAt.toISOString(),
    }));

    const body: NotificationListDTO = { items, unreadCount, page, limit };
    return ok(body);
  } catch (err) {
    return serverError(err);
  }
}
