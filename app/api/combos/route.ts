import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, badRequest, serverError } from "@/lib/api/response";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";
import { validateGameSpecific } from "@/lib/games/registry";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const game = searchParams.get("game");
    const character = searchParams.get("character");
    const difficulty = searchParams.get("difficulty") as "easy" | "medium" | "hard" | null;
    const tags = searchParams.get("tags")?.split(",").filter(Boolean);
    const sort = searchParams.get("sort") ?? "latest";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "18")));

    const where: Prisma.ComboWhereInput = {
      status: "published",
      ...(game && { game: { slug: game } }),
      ...(character && { character: { slug: character } }),
      ...(difficulty && { difficulty }),
      ...(tags?.length && { tags: { hasSome: tags } }),
    };

    const orderBy: Prisma.ComboOrderByWithRelationInput =
      sort === "popular"   ? { likeCount: "desc" } :
      sort === "downloads" ? { downloadCount: "desc" } :
                             { createdAt: "desc" };

    const [combos, total] = await Promise.all([
      prisma.combo.findMany({ where, include: COMBO_INCLUDE, orderBy, skip: (page - 1) * limit, take: limit }),
      prisma.combo.count({ where }),
    ]);

    return ok({ items: combos.map(toComboListItem), total, page, limit });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      const { unauthorized } = await import("@/lib/api/response");
      return unauthorized();
    }
    const userId = session.user.id;

    const body = await req.json();
    const { title, description, gameSlug, characterSlug, difficulty, tags, durationMs,
            inputSummary, gameSpecific, thumbnailUrl, videoUrl, tutfileUrl, patchVersion } = body;

    if (!title || !gameSlug || !characterSlug || !difficulty) {
      return badRequest("필수 필드가 누락되었습니다");
    }

    let validatedGameSpecific: unknown;
    try {
      validatedGameSpecific = validateGameSpecific(gameSlug, gameSpecific ?? {});
    } catch (e) {
      return badRequest(`game_specific 검증 실패: ${e instanceof Error ? e.message : "invalid"}`);
    }

    const game = await prisma.game.findUnique({ where: { slug: gameSlug } });
    if (!game) return badRequest("존재하지 않는 게임입니다");

    const character = await prisma.character.findUnique({
      where: { gameId_slug: { gameId: game.id, slug: characterSlug } },
    });
    if (!character) return badRequest("존재하지 않는 캐릭터입니다");

    const combo = await prisma.combo.create({
      data: {
        title,
        description,
        authorId: userId,
        gameId: game.id,
        characterId: character.id,
        difficulty,
        tags: tags ?? [],
        durationMs,
        inputCount: (inputSummary as unknown[])?.length ?? 0,
        inputSummary: inputSummary ?? [],
        gameSpecific: validatedGameSpecific as object,
        thumbnailUrl,
        videoUrl,
        tutfileUrl,
        patchVersion,
      },
    });

    return ok({ id: combo.id }, 201);
  } catch (err) {
    return serverError(err);
  }
}
