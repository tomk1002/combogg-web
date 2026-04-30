import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, badRequest } from "@/lib/api/response";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const nickname = searchParams.get("nickname")?.trim();

  if (!nickname || nickname.length < 2 || nickname.length > 24) {
    return badRequest("닉네임은 2~24자여야 합니다");
  }

  const session = await getSession();
  const existing = await prisma.user.findUnique({ where: { nickname }, select: { id: true } });

  // Available if no one has it, or it belongs to the current user
  const available = !existing || existing.id === session?.user?.id;
  return ok({ available });
}
