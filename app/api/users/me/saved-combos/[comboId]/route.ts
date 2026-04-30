import { getSession } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/db";
import { ok, unauthorized, serverError } from "@/lib/api/response";

export async function DELETE(_req: Request, { params }: { params: Promise<{ comboId: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const { comboId } = await params;

  try {
    await prisma.savedCombo.deleteMany({
      where: { userId: session.user.id, comboId },
    });
    return ok({ saved: false });
  } catch (err) {
    return serverError(err);
  }
}
