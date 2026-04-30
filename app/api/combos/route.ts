import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, badRequest, unauthorized, tooManyRequests, serverError } from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";
import { validateGameSpecific } from "@/lib/games/registry";
import { parseTutfile, buildInputSummary } from "@/lib/tutfile";
import { getSupabaseAdmin, BUCKETS } from "@/lib/supabase";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const game       = searchParams.get("game");
    const character  = searchParams.get("character");
    const difficulty = searchParams.get("difficulty") as "easy" | "medium" | "hard" | null;
    const tags       = searchParams.get("tags")?.split(",").filter(Boolean);
    const sort       = searchParams.get("sort") ?? "latest";
    const page       = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit      = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "18")));

    const where: Prisma.ComboWhereInput = {
      status: "published",
      ...(game       && { game: { slug: game } }),
      ...(character  && { character: { slug: character } }),
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
    if (!session?.user?.id) return unauthorized();
    const userId = session.user.id;

    if (!rateLimit(`upload:${userId}`, 10, 60_000)) return tooManyRequests();

    const body = await req.json();

    // ── 웹 업로드 흐름: tutfilePath 있으면 서버에서 파싱 ────────
    if (body.tutfilePath) {
      return await handleTutfileUpload(userId, body);
    }

    // ── 앱 업로드 흐름: 메타데이터 직접 전달 ──────────────────────
    const { title, description, tip, gameSlug, characterSlug, difficulty, tags,
            durationMs, inputSummary, gameSpecific, thumbnailUrl, videoUrl,
            tutfileUrl, patchVersion } = body;

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
        title, description, tip, authorId: userId,
        gameId: game.id, characterId: character.id,
        difficulty, tags: tags ?? [],
        durationMs,
        inputCount: (inputSummary as unknown[])?.length ?? 0,
        inputSummary: inputSummary ?? [],
        gameSpecific: validatedGameSpecific as object,
        thumbnailUrl, videoUrl, tutfileUrl, patchVersion,
      },
    });

    return ok({ id: combo.id }, 201);
  } catch (err) {
    return serverError(err);
  }
}

// ── tutfile 서버 처리 ─────────────────────────────────────────
async function handleTutfileUpload(userId: string, body: Record<string, unknown>) {
  const { tutfilePath, title, description, tip, characterSlug, difficulty, tags,
          gameSpecific: gameSpecificOverride, thumbnailUrl } = body as {
    tutfilePath: string;
    title?: string;
    description?: string;
    tip?: string;
    characterSlug?: string;
    difficulty?: string;
    tags?: string[];
    gameSpecific?: Record<string, unknown>;
    thumbnailUrl?: string;
  };

  const supabaseAdmin = getSupabaseAdmin();

  // 1. Supabase Storage에서 .tutfile 다운로드
  const storagePath = tutfilePath.replace(`${BUCKETS.tutfiles}/`, "");
  const { data: fileBlob, error: dlErr } = await supabaseAdmin.storage
    .from(BUCKETS.tutfiles)
    .download(storagePath);

  if (dlErr || !fileBlob) return serverError("tutfile 다운로드 실패");

  // 2. fflate로 파싱
  let parsed;
  try {
    parsed = await parseTutfile(await fileBlob.arrayBuffer());
  } catch (e) {
    return badRequest(`tutfile 파싱 실패: ${e instanceof Error ? e.message : "invalid"}`);
  }

  const { manifest, inputs, videoBuffer } = parsed;
  const gameSlug = manifest.game;

  // 3. game_specific 검증
  const rawGameSpecific = gameSpecificOverride ?? manifest.game_specific ?? {};
  let validatedGameSpecific: unknown;
  try {
    validatedGameSpecific = validateGameSpecific(gameSlug, rawGameSpecific);
  } catch (e) {
    return badRequest(`game_specific 검증 실패: ${e instanceof Error ? e.message : "invalid"}`);
  }

  // 4. game / character 조회
  const game = await prisma.game.findUnique({ where: { slug: gameSlug } });
  if (!game) return badRequest(`지원하지 않는 게임: ${gameSlug}`);

  const charSlug = characterSlug ?? manifest.character;
  const character = await prisma.character.findUnique({
    where: { gameId_slug: { gameId: game.id, slug: charSlug } },
  });
  if (!character) return badRequest(`존재하지 않는 캐릭터: ${charSlug}`);

  // 5. video.mp4 업로드
  let videoUrl: string | null = null;
  if (videoBuffer) {
    const videoPath = `${userId}/${Date.now()}.mp4`;
    const { error: vidErr } = await supabaseAdmin.storage
      .from(BUCKETS.videos)
      .upload(videoPath, videoBuffer, { contentType: "video/mp4" });

    if (!vidErr) {
      const { data } = supabaseAdmin.storage.from(BUCKETS.videos).getPublicUrl(videoPath);
      videoUrl = data.publicUrl;
    }
  }

  // 6. tutfile URL (Storage public/signed 방식이 아니라 path 저장)
  const tutfileUrl = tutfilePath;

  const inputSummary = buildInputSummary(inputs);

  // 7. Combo 레코드 생성
  const combo = await prisma.combo.create({
    data: {
      title:        title ?? manifest.title,
      description:  description ?? null,
      tip:          tip ?? null,
      authorId:     userId,
      gameId:       game.id,
      characterId:  character.id,
      difficulty:   (difficulty ?? manifest.difficulty) as "easy" | "medium" | "hard",
      tags:         tags ?? manifest.tags,
      durationMs:   manifest.duration_ms ?? null,
      inputCount:   inputs.length,
      inputSummary,
      gameSpecific: validatedGameSpecific as object,
      thumbnailUrl: thumbnailUrl ?? null,
      videoUrl,
      tutfileUrl,
      patchVersion: manifest.patch_version ?? null,
    },
  });

  return ok({ id: combo.id }, 201);
}
