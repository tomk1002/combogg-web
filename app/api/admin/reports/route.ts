import { prisma } from "@/lib/db";
import { ok, serverError } from "@/lib/api/response";
import { requireAdminApi } from "@/lib/auth/require-admin";

const PAGE_SIZE = 30;
const VALID_STATUSES = new Set(["pending", "resolved", "dismissed"]);

export async function GET(req: Request) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const url = new URL(req.url);
    const status = url.searchParams.get("status") ?? "pending";
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const where = VALID_STATUSES.has(status) ? { status } : {};

    const [total, items] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          reporter: { select: { id: true, nickname: true, riotGameName: true, riotTagLine: true } },
          resolvedBy: { select: { id: true, nickname: true } },
        },
      }),
    ]);

    return ok({ items, total, page, limit: PAGE_SIZE });
  } catch (err) {
    return serverError(err);
  }
}
