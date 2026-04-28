import { prisma } from "@/lib/db";
import { ok, notFound, serverError } from "@/lib/api/response";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Number(searchParams.get("limit") ?? "18"));

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) return notFound();

    const [combos, total] = await Promise.all([
      prisma.combo.findMany({
        where: { authorId: id, status: "published" },
        include: COMBO_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.combo.count({ where: { authorId: id, status: "published" } }),
    ]);

    return ok({ items: combos.map(toComboListItem), total, page, limit });
  } catch (err) {
    return serverError(err);
  }
}
