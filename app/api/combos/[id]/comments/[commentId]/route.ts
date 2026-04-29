import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, notFound, unauthorized, forbidden, badRequest, serverError } from "@/lib/api/response";

interface Ctx { params: Promise<{ id: string; commentId: string }> }

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { commentId } = await params;
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return notFound();
    if (comment.userId !== session.user.id) return forbidden();

    const { content } = await req.json();
    if (!content?.trim()) return badRequest("내용이 필요합니다");

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: { content: content.trim() },
    });
    return ok({ id: updated.id, content: updated.content });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { commentId } = await params;
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();

    const comment = await prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) return notFound();
    if (comment.userId !== session.user.id) return forbidden();

    await prisma.comment.delete({ where: { id: commentId } });
    return ok({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
