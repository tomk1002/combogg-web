import { auth } from "@/lib/auth";
import { ok, unauthorized } from "@/lib/api/response";
import { signDesktopToken } from "@/lib/desktop-token";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return unauthorized();

  const token = await signDesktopToken(session.user.id);
  return ok({ token });
}
