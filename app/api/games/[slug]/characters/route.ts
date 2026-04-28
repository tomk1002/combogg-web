import { prisma } from "@/lib/db";
import { ok, notFound, serverError } from "@/lib/api/response";

interface Ctx { params: Promise<{ slug: string }> }

export async function GET(req: Request, { params }: Ctx) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");

    const game = await prisma.game.findUnique({ where: { slug } });
    if (!game) return notFound();

    const characters = await prisma.character.findMany({
      where: {
        gameId: game.id,
        ...(q && { name: { contains: q, mode: "insensitive" } }),
      },
      select: { id: true, slug: true, name: true, iconUrl: true },
      orderBy: { name: "asc" },
    });

    return ok(characters);
  } catch (err) {
    return serverError(err);
  }
}
