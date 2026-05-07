import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, badRequest, unauthorized, serverError } from "@/lib/api/response";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();
    const userId = session.user.id;

    const body = (await req.json().catch(() => ({}))) as { ids?: string[]; all?: boolean };

    if (body.all) {
      const result = await prisma.notification.updateMany({
        where: { recipientId: userId, readAt: null },
        data: { readAt: new Date() },
      });
      return ok({ ok: true, marked: result.count });
    }

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const result = await prisma.notification.updateMany({
        where: { recipientId: userId, id: { in: body.ids }, readAt: null },
        data: { readAt: new Date() },
      });
      return ok({ ok: true, marked: result.count });
    }

    return badRequest("ids 또는 all 중 하나를 지정해야 합니다");
  } catch (err) {
    return serverError(err);
  }
}
