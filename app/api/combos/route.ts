import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, badRequest, unauthorized, tooManyRequests, serverError } from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";
import { validateGameSpecific } from "@/lib/games/registry";
import { parseTutfile, buildInputSummary, type ParsedInput, type ParsedStep } from "@/lib/tutfile";
import { getSupabaseAdmin, BUCKETS } from "@/lib/supabase";
import { verifyDesktopToken } from "@/lib/desktop-token";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

async function resolveUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    return verifyDesktopToken(auth.slice(7));
  }
  const session = await getSession();
  return session?.user?.id ?? null;
}

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
    const featured   = searchParams.get("featured") === "true";
    const savedBy    = searchParams.get("savedBy");

    // 기본은 published만, featured=true 시 featured만
    const statusFilter: Prisma.ComboWhereInput["status"] = featured ? "featured" : "published";

    const where: Prisma.ComboWhereInput = {
      status: statusFilter,
      ...(game       && { game: { slug: game } }),
      ...(character  && { character: { slug: character } }),
      ...(difficulty && { difficulty }),
      ...(tags?.length && { tags: { hasSome: tags } }),
    };

    // savedBy=me — 현재 사용자가 저장한 콤보만
    if (savedBy === "me") {
      const userId = await resolveUserId(req);
      if (!userId) return unauthorized();
      where.savedBy = { some: { userId } };
    }

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
    const userId = await resolveUserId(req);
    if (!userId) return unauthorized();

    if (!rateLimit(`upload:${userId}`, 10, 60_000)) return tooManyRequests();

    const body = await req.json();

    // ── 웹 업로드 흐름: tutfilePath 있으면 서버에서 파싱 ────────
    if (body.tutfilePath) {
      return await handleTutfileUpload(userId, body);
    }

    // ── 앱 업로드 흐름: 메타데이터 직접 전달 ──────────────────────
    const { title, description, tip, gameSlug, characterSlug, difficulty, tags,
            durationMs, inputSummary, gameSpecific, thumbnailUrl, videoUrl, videoCrop, videoTrim,
            tutfileUrl, patchVersion, status } = body;

    if (!title || !gameSlug || !characterSlug || !difficulty) {
      return badRequest("필수 필드가 누락되었습니다");
    }
    if (typeof title === "string" && title.length > 100) return badRequest("제목은 100자 이하로 입력해주세요");
    if (typeof description === "string" && description.length > 2000) return badRequest("설명은 2000자 이하로 입력해주세요");
    if (Array.isArray(tags) && tags.length > 10) return badRequest("태그는 최대 10개까지 입력 가능합니다");

    // status: 사용자는 'draft' 또는 'published'만 설정 가능 ('featured'는 admin 전용)
    if (status !== undefined && status !== "draft" && status !== "published") {
      return badRequest("status는 'draft' 또는 'published'만 가능합니다");
    }
    const resolvedStatus: "draft" | "published" = status === "draft" ? "draft" : "published";

    // videoCrop 검증 (선택)
    if (videoCrop !== undefined && videoCrop !== null) {
      if (typeof videoCrop !== "object") return badRequest("videoCrop은 객체여야 합니다");
      const { x, y, w, h } = videoCrop as { x?: unknown; y?: unknown; w?: unknown; h?: unknown };
      const isFrac = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
      if (!isFrac(x) || !isFrac(y) || !isFrac(w) || !isFrac(h)) {
        return badRequest("videoCrop의 x/y/w/h는 0~1 범위 숫자여야 합니다");
      }
    }

    // videoTrim 검증 (선택)
    if (videoTrim !== undefined && videoTrim !== null) {
      if (typeof videoTrim !== "object") return badRequest("videoTrim은 객체여야 합니다");
      const { start, end } = videoTrim as { start?: unknown; end?: unknown };
      if (typeof start !== "number" || !Number.isFinite(start) || start < 0) {
        return badRequest("videoTrim.start는 0 이상의 숫자여야 합니다");
      }
      if (typeof end !== "number" || !Number.isFinite(end) || end <= start) {
        return badRequest("videoTrim.end는 start보다 큰 숫자여야 합니다");
      }
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
        ...(videoCrop !== undefined && { videoCrop: videoCrop ?? undefined }),
        ...(videoTrim !== undefined && { videoTrim: videoTrim ?? undefined }),
        status: resolvedStatus,
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
          gameSpecific: gameSpecificOverride, thumbnailUrl, videoUrl: videoUrlOverride, status,
          editedInputs, editedSteps } = body as {
    tutfilePath: string;
    title?: string;
    description?: string;
    tip?: string;
    characterSlug?: string;
    difficulty?: string;
    tags?: string[];
    gameSpecific?: Record<string, unknown>;
    thumbnailUrl?: string;
    videoUrl?: string;
    status?: string;
    editedInputs?: ParsedInput[];
    editedSteps?: ParsedStep[];
  };

  // editedInputs 형태 검증 — 신뢰할 수 없는 클라이언트 입력
  if (editedInputs !== undefined) {
    if (!Array.isArray(editedInputs)) return badRequest("editedInputs는 배열이어야 합니다");
    for (const inp of editedInputs) {
      if (!inp || typeof inp !== "object") return badRequest("editedInputs 항목 형식이 올바르지 않습니다");
      if (typeof inp.t !== "number" || !Number.isFinite(inp.t) || inp.t < 0) {
        return badRequest("editedInputs.t 는 0 이상의 숫자여야 합니다");
      }
      if (typeof inp.category !== "string" || inp.category.length === 0 || inp.category.length > 32) {
        return badRequest("editedInputs.category 는 비어 있지 않은 문자열이어야 합니다");
      }
    }
  }
  if (editedSteps !== undefined) {
    if (!Array.isArray(editedSteps)) return badRequest("editedSteps는 배열이어야 합니다");
  }

  // status: 사용자는 'draft' 또는 'published'만 설정 가능 ('featured'는 admin 전용)
  if (status !== undefined && status !== "draft" && status !== "published") {
    return badRequest("status는 'draft' 또는 'published'만 가능합니다");
  }
  const resolvedStatus: "draft" | "published" = status === "draft" ? "draft" : "published";

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

  const { manifest, videoBuffer } = parsed;
  const gameSlug = manifest.game;

  // TODO: editedInputs/editedSteps 가 있어도 Storage 의 .tutfile 자체는 원본 그대로
  // 남는다 — 일관성 깨짐 인지하고 있음. 차후 서버에서 재패킹하거나
  // 클라이언트에서 .tutfile 을 다시 zip 해서 올리는 방향 검토.
  const inputs: ParsedInput[] = editedInputs ?? parsed.inputs;
  const steps: ParsedStep[] = editedSteps ?? parsed.steps;
  void steps; // steps 는 현재 DB 에 별도 저장하지 않음 — .tutfile 안에서만 사용

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

  // 5. video — use client-provided URL if given, otherwise upload from tutfile
  let videoUrl: string | null = videoUrlOverride ?? null;
  if (!videoUrl && videoBuffer) {
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
      status:       resolvedStatus,
    },
  });

  return ok({ id: combo.id }, 201);
}

// Explicit OPTIONS handler for Overwolf preflight requests.
export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
