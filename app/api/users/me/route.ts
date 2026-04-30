import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, unauthorized, badRequest, serverError } from "@/lib/api/response";

export async function PATCH(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();

    const { nickname, avatarUrl } = await req.json();

    const updateData: { nickname?: string; avatarUrl?: string } = {};

    if (nickname?.trim()) {
      const trimmed = (nickname as string).trim();
      if (trimmed.length < 2 || trimmed.length > 24) {
        return badRequest("닉네임은 2~24자여야 합니다");
      }
      const existing = await prisma.user.findUnique({ where: { nickname: trimmed } });
      if (existing && existing.id !== session.user.id) {
        return badRequest("이미 사용 중인 닉네임입니다");
      }
      updateData.nickname = trimmed;
    }

    if (avatarUrl) {
      updateData.avatarUrl = avatarUrl as string;
    }

    if (Object.keys(updateData).length === 0) {
      return badRequest("변경할 내용이 없습니다");
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, nickname: true, avatarUrl: true },
    });

    return ok(user);
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session?.user?.id) return unauthorized();

    const userId = session.user.id;

    await prisma.$transaction([
      // Soft-delete user's combos so content remains visible (marked removed)
      prisma.combo.updateMany({
        where: { authorId: userId },
        data: { status: "removed" },
      }),
      // Delete user — cascades: accounts, sessions, likes, comments, savedCombos
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return ok({ deleted: true });
  } catch (err) {
    return serverError(err);
  }
}
