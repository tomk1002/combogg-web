import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, notFound, forbidden, serverError, badRequest } from "@/lib/api/response";
import { COMBO_INCLUDE, toComboDetail } from "@/lib/combo-queries";

interface Ctx { params: Promise<{ id: string }> }

export async function GET(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getSession();

    const combo = await prisma.combo.findUnique({ where: { id, status: "published" }, include: COMBO_INCLUDE });
    if (!combo) return notFound();

    // 조회수 +1 (fire-and-forget)
    prisma.combo.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

    let isLiked = false;
    if (session?.user?.id) {
      const like = await prisma.like.findUnique({ where: { userId_comboId: { userId: session.user.id, comboId: id } } });
      isLiked = !!like;
    }

    return ok(toComboDetail(combo, isLiked));
  } catch (err) {
    return serverError(err);
  }
}

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      const { unauthorized } = await import("@/lib/api/response");
      return unauthorized();
    }

    const combo = await prisma.combo.findUnique({ where: { id } });
    if (!combo) return notFound();
    if (combo.authorId !== session.user.id) return forbidden();

    const body = await req.json();
    const { title, description, tip, difficulty, tags, gameSpecific, inputSummary, steps, thumbnailUrl, videoUrl } = body;

    const updated = await prisma.combo.update({
      where: { id },
      data: {
        title,
        description,
        tip,
        difficulty,
        tags,
        ...(gameSpecific && { gameSpecific }),
        ...(inputSummary !== undefined && {
          inputSummary,
          inputCount: (inputSummary as unknown[])?.length ?? 0,
        }),
        ...(steps !== undefined && { steps }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(videoUrl !== undefined && { videoUrl }),
      },
    });

    return ok({ id: updated.id });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session?.user?.id) {
      const { unauthorized } = await import("@/lib/api/response");
      return unauthorized();
    }

    const combo = await prisma.combo.findUnique({ where: { id } });
    if (!combo) return notFound();
    if (combo.authorId !== session.user.id) return forbidden();

    await prisma.combo.update({ where: { id }, data: { status: "removed" } });
    return ok({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
