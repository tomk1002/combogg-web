import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, notFound, unauthorized, badRequest, tooManyRequests, serverError } from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Number(searchParams.get("limit") ?? "20"));

    const combo = await prisma.combo.findUnique({ where: { id, status: "published" } });
    if (!combo) return notFound();

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { comboId: id },
        include: { user: { select: { id: true, nickname: true, avatarUrl: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.comment.count({ where: { comboId: id } }),
    ]);

    return ok({
      items: comments.map((c) => ({
        id: c.id,
        content: c.content,
        author: c.user,
        createdAt: c.createdAt.toISOString(),
      })),
      total,
      page,
      limit,
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();

    if (!rateLimit(`comment:${session.user.id}`, 10, 60_000)) return tooManyRequests();

    const combo = await prisma.combo.findUnique({ where: { id, status: "published" } });
    if (!combo) return notFound();

    const { content } = await req.json();
    if (!content?.trim()) return badRequest("댓글 내용을 입력해주세요");

    const comment = await prisma.comment.create({
      data: { comboId: id, userId: session.user.id, content: content.trim() },
      include: { user: { select: { id: true, nickname: true, avatarUrl: true } } },
    });

    return ok({
      id: comment.id,
      content: comment.content,
      author: comment.user,
      createdAt: comment.createdAt.toISOString(),
    }, 201);
  } catch (err) {
    return serverError(err);
  }
}
