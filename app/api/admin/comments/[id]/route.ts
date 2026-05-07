import { prisma } from "@/lib/db";
import { ok, notFound, serverError } from "@/lib/api/response";
import { requireAdminApi } from "@/lib/auth/require-admin";

interface Ctx {
  params: Promise<{ id: string }>;
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const existing = await prisma.comment.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound();

    await prisma.comment.delete({ where: { id } });
    return ok({ success: true });
  } catch (err) {
    return serverError(err);
  }
}
