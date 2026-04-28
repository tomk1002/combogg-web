import { auth } from "@/lib/auth";
import { unauthorized } from "@/lib/api/response";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user?.id) {
    throw unauthorized();
  }
  return session.user as { id: string; name?: string | null; email?: string | null; image?: string | null };
}

export async function getSession() {
  return auth();
}
