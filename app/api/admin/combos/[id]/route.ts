import { prisma } from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAdminApi } from "@/lib/auth/require-admin";
import type { ComboStatus } from "@prisma/client";

interface Ctx {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES: ComboStatus[] = ["draft", "published", "featured", "removed"];

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("body가 필요합니다");

    const { status } = body as { status?: string };
    if (!status || !VALID_STATUSES.includes(status as ComboStatus)) {
      return badRequest(`status는 ${VALID_STATUSES.join(", ")} 중 하나여야 합니다`);
    }

    const existing = await prisma.combo.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound();

    const updated = await prisma.combo.update({
      where: { id },
      data: { status: status as ComboStatus },
      select: { id: true, status: true },
    });

    return ok({ id: updated.id, status: updated.status });
  } catch (err) {
    return serverError(err);
  }
}
