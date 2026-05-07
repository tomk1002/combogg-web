import { prisma } from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAdminApi } from "@/lib/auth/require-admin";
import type { UserRole } from "@prisma/client";

interface Ctx {
  params: Promise<{ id: string }>;
}

const VALID_ROLES: UserRole[] = ["USER", "ADMIN"];

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("body가 필요합니다");

    const { role } = body as { role?: string };
    if (!role || !VALID_ROLES.includes(role as UserRole)) {
      return badRequest(`role은 ${VALID_ROLES.join(", ")} 중 하나여야 합니다`);
    }

    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound();

    const updated = await prisma.user.update({
      where: { id },
      data: { role: role as UserRole },
      select: { id: true, role: true },
    });

    return ok({ id: updated.id, role: updated.role });
  } catch (err) {
    return serverError(err);
  }
}
