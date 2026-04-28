import { prisma } from "@/lib/db";
import { ok, notFound, serverError } from "@/lib/api/response";

interface Ctx { params: Promise<{ slug: string }> }

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { slug } = await params;
    const game = await prisma.game.findUnique({ where: { slug } });
    if (!game) return notFound();
    return ok(game);
  } catch (err) {
    return serverError(err);
  }
}
