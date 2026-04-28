import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api/response";

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();

    const { nickname } = await req.json();
    if (!nickname?.trim()) return badRequest("닉네임을 입력해주세요");

    const trimmed = nickname.trim();
    if (trimmed.length < 2 || trimmed.length > 24) {
      return badRequest("닉네임은 2~24자여야 합니다");
    }

    const existing = await prisma.user.findUnique({ where: { nickname: trimmed } });
    if (existing && existing.id !== session.user.id) {
      return badRequest("이미 사용 중인 닉네임입니다");
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { nickname: trimmed },
      select: { id: true, nickname: true, avatarUrl: true },
    });

    return ok(user);
  } catch (err) {
    return serverError(err);
  }
}
