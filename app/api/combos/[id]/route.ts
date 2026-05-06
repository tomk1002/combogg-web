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
    const { title, description, tip, difficulty, tags, gameSpecific, inputSummary, steps, thumbnailUrl, videoUrl, status } = body;

    // status: 사용자는 'draft' 또는 'published'만 설정 가능 ('featured'는 admin 전용)
    if (status !== undefined && status !== "draft" && status !== "published") {
      return badRequest("status는 'draft' 또는 'published'만 가능합니다");
    }

    const updated = await prisma.combo.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(tip !== undefined && { tip }),
        ...(difficulty !== undefined && { difficulty }),
        ...(tags !== undefined && { tags }),
        ...(gameSpecific !== undefined && { gameSpecific }),
        ...(inputSummary !== undefined && {
          inputSummary,
          inputCount: (inputSummary as unknown[])?.length ?? 0,
        }),
        ...(steps !== undefined && { steps }),
        ...(thumbnailUrl !== undefined && { thumbnailUrl }),
        ...(videoUrl !== undefined && { videoUrl }),
        ...(status !== undefined && { status }),
      },
    });

    return ok({ id: updated.id, status: updated.status });
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
