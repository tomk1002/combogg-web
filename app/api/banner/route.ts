import { prisma } from "@/lib/db";
import { ok, serverError } from "@/lib/api/response";

export async function GET() {
  try {
    // Single-row banner (id = 1). If missing, return a disabled default.
    const banner = await prisma.siteBanner.findUnique({ where: { id: 1 } });
    if (!banner) {
      return ok({ id: 1, enabled: false, message: "", variant: "info", updatedAt: null });
    }
    return ok(banner);
  } catch (err) {
    return serverError(err);
  }
}
