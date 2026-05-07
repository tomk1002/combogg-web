import { prisma } from "@/lib/db";
import { ok, badRequest, notFound, serverError } from "@/lib/api/response";
import { requireAdminApi } from "@/lib/auth/require-admin";

interface Ctx {
  params: Promise<{ id: string }>;
}

const VALID_STATUSES = new Set(["resolved", "dismissed"]);

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const status = (body && typeof body === "object" ? (body as { status?: string }).status : undefined) ?? "";
    if (!VALID_STATUSES.has(status)) {
      return badRequest("status는 'resolved' 또는 'dismissed'여야 합니다");
    }

    const existing = await prisma.report.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound();

    const updated = await prisma.report.update({
      where: { id },
      data: {
        status,
        resolvedAt: new Date(),
        resolvedById: guard.userId,
      },
      select: { id: true, status: true, resolvedAt: true, resolvedById: true },
    });

    return ok(updated);
  } catch (err) {
    return serverError(err);
  }
}
