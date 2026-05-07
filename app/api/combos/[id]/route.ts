import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
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
    const { title, description, tip, difficulty, tags, gameSpecific, inputSummary, steps, thumbnailUrl, videoUrl, videoCrop, videoTrim, status } = body;

    // status: 사용자는 'draft' 또는 'published'만 설정 가능 ('featured'는 admin 전용)
    if (status !== undefined && status !== "draft" && status !== "published") {
      return badRequest("status는 'draft' 또는 'published'만 가능합니다");
    }

    // videoCrop 검증 — null(=clear) 이거나, 정규화된 0~1 범위의 4개 필드.
    if (videoCrop !== undefined && videoCrop !== null) {
      if (typeof videoCrop !== "object") return badRequest("videoCrop은 객체여야 합니다");
      const { x, y, w, h } = videoCrop as { x?: unknown; y?: unknown; w?: unknown; h?: unknown };
      const isFrac = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
      if (!isFrac(x) || !isFrac(y) || !isFrac(w) || !isFrac(h)) {
        return badRequest("videoCrop의 x/y/w/h는 0~1 범위 숫자여야 합니다");
      }
    }

    // videoTrim 검증 — null(=clear) 이거나 { start>=0, end>start } 인 객체.
    if (videoTrim !== undefined && videoTrim !== null) {
      if (typeof videoTrim !== "object") return badRequest("videoTrim은 객체여야 합니다");
      const { start, end } = videoTrim as { start?: unknown; end?: unknown };
      if (typeof start !== "number" || !Number.isFinite(start) || start < 0) {
        return badRequest("videoTrim.start는 0 이상의 숫자여야 합니다");
      }
      if (typeof end !== "number" || !Number.isFinite(end) || end <= start) {
        return badRequest("videoTrim.end는 start보다 큰 숫자여야 합니다");
      }
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
        ...(videoCrop !== undefined && { videoCrop: videoCrop ?? Prisma.JsonNull }),
        ...(videoTrim !== undefined && { videoTrim: videoTrim ?? Prisma.JsonNull }),
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
