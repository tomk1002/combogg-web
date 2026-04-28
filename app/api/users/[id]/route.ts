import { prisma } from "@/lib/db";
import { ok, notFound, serverError } from "@/lib/api/response";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const [user, comboCount] = await Promise.all([
      prisma.user.findUnique({
        where: { id },
        select: { id: true, nickname: true, avatarUrl: true, createdAt: true },
      }),
      prisma.combo.count({ where: { authorId: id, status: "published" } }),
    ]);

    if (!user) return notFound();

    return ok({ ...user, createdAt: user.createdAt.toISOString(), comboCount });
  } catch (err) {
    return serverError(err);
  }
}
