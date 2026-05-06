import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";
import { verifyDesktopToken } from "@/lib/desktop-token";
import { NextResponse } from "next/server";
import type { ComboListItemDTO } from "@/lib/api/types";

async function resolveUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    return verifyDesktopToken(auth.slice(7));
  }
  const session = await getSession();
  return session?.user?.id ?? null;
}

type CuratedSource = "saved" | "featured" | "popular";

export interface CuratedComboItemDTO extends ComboListItemDTO {
  source: CuratedSource;
}

// 오버레이용 큐레이트된 콤보 묶음 — saved / featured / popular 3종을 한 번에 반환
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const characterSlug = searchParams.get("characterSlug");
    if (!characterSlug) return badRequest("characterSlug 가 필요합니다");

    const limitPopular = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit_popular") ?? "5")),
    );
    const limitFeatured = Math.min(
      50,
      Math.max(1, Number(searchParams.get("limit_featured") ?? "5")),
    );

    const userId = await resolveUserId(req);

    // 캐릭터 조회 — 없으면 빈 결과 반환
    const character = await prisma.character.findFirst({
      where: { slug: characterSlug },
      select: { id: true },
    });
    if (!character) return ok({ items: [] satisfies CuratedComboItemDTO[] });

    const characterId = character.id;

    // 3개 쿼리를 병렬 실행
    // popular 는 (likeCount + downloadCount) DESC 가 필요한데 Prisma orderBy 에서
    // 산술식이 안 되므로 likeCount DESC 로 오버샘플 후 메모리에서 재정렬한다.
    const popularOversample = Math.max(limitPopular * 3, 20);

    const [saved, featured, popularRaw] = await Promise.all([
      // saved — 인증 없으면 빈 배열
      userId
        ? prisma.savedCombo.findMany({
            where: {
              userId,
              combo: {
                characterId,
                status: { in: ["published", "featured"] },
              },
            },
            include: { combo: { include: COMBO_INCLUDE } },
            orderBy: { savedAt: "desc" },
          })
        : Promise.resolve([] as Array<{ combo: Parameters<typeof toComboListItem>[0] }>),

      // featured — featured 상태인 콤보를 최신순
      prisma.combo.findMany({
        where: { characterId, status: "featured" },
        include: COMBO_INCLUDE,
        orderBy: { createdAt: "desc" },
        take: limitFeatured,
      }),

      // popular — published 상태에서 likeCount 내림차순으로 오버샘플
      prisma.combo.findMany({
        where: { characterId, status: "published" },
        include: COMBO_INCLUDE,
        orderBy: [{ likeCount: "desc" }, { downloadCount: "desc" }],
        take: popularOversample,
      }),
    ]);

    // popular 메모리 재정렬: (likeCount + downloadCount) DESC, 이후 limit_popular 만 사용
    const popular = [...popularRaw]
      .sort((a, b) => b.likeCount + b.downloadCount - (a.likeCount + a.downloadCount))
      .slice(0, limitPopular);

    // 우선순위 saved > featured > popular 로 dedupe
    const seen = new Set<string>();
    const items: CuratedComboItemDTO[] = [];

    for (const s of saved) {
      if (seen.has(s.combo.id)) continue;
      seen.add(s.combo.id);
      items.push({ ...toComboListItem(s.combo), source: "saved" });
    }
    for (const c of featured) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      items.push({ ...toComboListItem(c), source: "featured" });
    }
    for (const c of popular) {
      if (seen.has(c.id)) continue;
      seen.add(c.id);
      items.push({ ...toComboListItem(c), source: "popular" });
    }

    return ok({ items });
  } catch (err) {
    return serverError(err);
  }
}

// Explicit OPTIONS handler for Overwolf preflight requests.
export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
