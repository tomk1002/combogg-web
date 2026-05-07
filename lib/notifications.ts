import { prisma } from "@/lib/db";
import type { NotificationType } from "@prisma/client";

interface CreateNotificationArgs {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  comboId: string;
  commentId?: string;
  /** share 같이 중복 방지 필요한 경우 — 같은 (recipient, actor, combo, type) 중복 윈도우 (ms). null이면 매번 생성. */
  dedupeWindowMs?: number;
}

// 자기 자신의 콤보 액션은 알림 생성하지 않음. 작성자가 알림을 받는 구조.
// fire-and-forget으로 호출해도 무방하지만 트랜잭션 안에서 부르려면 await.
export async function createNotification({
  recipientId,
  actorId,
  type,
  comboId,
  commentId,
  dedupeWindowMs,
}: CreateNotificationArgs): Promise<void> {
  if (recipientId === actorId) return;

  if (dedupeWindowMs && dedupeWindowMs > 0) {
    const since = new Date(Date.now() - dedupeWindowMs);
    const recent = await prisma.notification.findFirst({
      where: { recipientId, actorId, comboId, type, createdAt: { gte: since } },
      select: { id: true },
    });
    if (recent) return;
  }

  await prisma.notification.create({
    data: { recipientId, actorId, type, comboId, commentId },
  });
}
