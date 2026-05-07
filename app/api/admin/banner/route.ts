import { prisma } from "@/lib/db";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { requireAdminApi } from "@/lib/auth/require-admin";

const VALID_VARIANTS = new Set(["info", "warning", "announcement"]);

export async function PATCH(req: Request) {
  try {
    const guard = await requireAdminApi();
    if (!guard.ok) return guard.response;

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return badRequest("body가 필요합니다");

    const { enabled, message, variant } = body as {
      enabled?: unknown;
      message?: unknown;
      variant?: unknown;
    };

    if (enabled !== undefined && typeof enabled !== "boolean") {
      return badRequest("enabled는 boolean이어야 합니다");
    }
    if (message !== undefined && typeof message !== "string") {
      return badRequest("message는 문자열이어야 합니다");
    }
    if (variant !== undefined && (typeof variant !== "string" || !VALID_VARIANTS.has(variant))) {
      return badRequest(`variant는 ${[...VALID_VARIANTS].join(", ")} 중 하나여야 합니다`);
    }

    const data: { enabled?: boolean; message?: string; variant?: string } = {};
    if (enabled !== undefined) data.enabled = enabled;
    if (message !== undefined) data.message = (message as string).slice(0, 500);
    if (variant !== undefined) data.variant = variant as string;

    // upsert ensures row id=1 exists even if the migration insert was missed.
    const banner = await prisma.siteBanner.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        enabled: data.enabled ?? false,
        message: data.message ?? "",
        variant: data.variant ?? "info",
      },
    });

    return ok(banner);
  } catch (err) {
    return serverError(err);
  }
}
