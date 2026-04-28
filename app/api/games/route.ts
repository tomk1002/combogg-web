import { prisma } from "@/lib/db";
import { ok, serverError } from "@/lib/api/response";

export async function GET() {
  try {
    const games = await prisma.game.findMany({
      select: { slug: true, name: true, iconUrl: true, currentPatch: true },
      orderBy: { createdAt: "asc" },
    });
    return ok(games);
  } catch (err) {
    return serverError(err);
  }
}
