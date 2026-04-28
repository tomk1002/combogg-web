import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, notFound, unauthorized, serverError } from "@/lib/api/response";

interface Ctx { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();

    const userId = session.user.id;
    const combo = await prisma.combo.findUnique({ where: { id, status: "published" } });
    if (!combo) return notFound();

    const existing = await prisma.like.findUnique({
      where: { userId_comboId: { userId, comboId: id } },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.like.delete({ where: { userId_comboId: { userId, comboId: id } } }),
        prisma.combo.update({ where: { id }, data: { likeCount: { decrement: 1 } } }),
      ]);
      return ok({ liked: false });
    } else {
      await prisma.$transaction([
        prisma.like.create({ data: { userId, comboId: id } }),
        prisma.combo.update({ where: { id }, data: { likeCount: { increment: 1 } } }),
      ]);
      return ok({ liked: true });
    }
  } catch (err) {
    return serverError(err);
  }
}
