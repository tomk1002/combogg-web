import { getSession } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/db";
import { ok, unauthorized, serverError } from "@/lib/api/response";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";

// 저장된 콤보 목록 — 앱 시작 시 동기화용
export async function GET() {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  try {
    const saved = await prisma.savedCombo.findMany({
      where: { userId: session.user.id },
      include: { combo: { include: COMBO_INCLUDE } },
      orderBy: { savedAt: "desc" },
    });

    const items = saved
      .filter((s) => s.combo.status === "published")
      .map((s) => ({
        ...toComboListItem(s.combo),
        savedAt: s.savedAt.toISOString(),
      }));

    return ok(items);
  } catch (err) {
    return serverError(err);
  }
}

// 콤보 저장 (토글 — 이미 저장돼 있으면 제거)
export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const body = await req.json().catch(() => null);
  const comboId = body?.comboId as string | undefined;
  if (!comboId) return ok({ saved: false });

  try {
    const existing = await prisma.savedCombo.findUnique({
      where: { userId_comboId: { userId: session.user.id, comboId } },
    });

    if (existing) {
      await prisma.savedCombo.delete({ where: { id: existing.id } });
      return ok({ saved: false });
    } else {
      await prisma.savedCombo.create({
        data: { userId: session.user.id, comboId },
      });
      return ok({ saved: true });
    }
  } catch (err) {
    return serverError(err);
  }
}
