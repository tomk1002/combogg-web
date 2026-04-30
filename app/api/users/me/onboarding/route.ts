import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, unauthorized, serverError } from "@/lib/api/response";

export async function POST() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingCompleted: true },
    });

    return ok({ onboardingCompleted: true });
  } catch (err) {
    return serverError(err);
  }
}
