import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { forbidden, unauthorized } from "@/lib/api/response";

/**
 * Server component / page guard. Redirects non-admins silently to "/" so
 * existence of the admin tree isn't leaked via a 404.
 */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    redirect("/");
  }
  return { session, userId: session.user.id };
}

/**
 * API route guard. Returns the admin user info, or a Response (401/403) that
 * the caller MUST forward as the route response. Avoids leaking admin
 * existence — non-admins get the same 403 a non-admin user would.
 */
export async function requireAdminApi(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: Response }
> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, response: unauthorized() };
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") {
    return { ok: false, response: forbidden() };
  }
  return { ok: true, userId: session.user.id };
}
