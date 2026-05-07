import type { Prisma } from "@prisma/client";
import type { ComboListItemDTO, ComboDetailDTO, InputEntryDTO, VideoCropDTO, VideoTrimDTO } from "@/lib/api/types";

export const COMBO_INCLUDE = {
  author: { select: { id: true, nickname: true, avatarUrl: true, riotGameName: true, riotTagLine: true } },
  game:   { select: { slug: true, name: true } },
  character: { select: { slug: true, name: true, iconUrl: true } },
} satisfies Prisma.ComboInclude;

type ComboWithRelations = Prisma.ComboGetPayload<{ include: typeof COMBO_INCLUDE }>;

export function toComboListItem(c: ComboWithRelations): ComboListItemDTO {
  return {
    id: c.id,
    title: c.title,
    author: { ...c.author, nickname: c.author.nickname ?? "", riotGameName: c.author.riotGameName, riotTagLine: c.author.riotTagLine },
    game: c.game,
    character: c.character,
    difficulty: c.difficulty as "easy" | "medium" | "hard",
    tags: c.tags,
    durationMs: c.durationMs,
    inputSummary: (c.inputSummary as unknown as InputEntryDTO[]) ?? [],
    thumbnailUrl: c.thumbnailUrl,
    videoUrl: c.videoUrl,
    likeCount: c.likeCount,
    downloadCount: c.downloadCount,
    viewCount: c.viewCount,
    patchVersion: c.patchVersion,
    createdAt: c.createdAt.toISOString(),
  };
}

export function toComboDetail(
  c: ComboWithRelations & { description: string | null; tip: string | null; gameSpecific: unknown; videoUrl: string | null; tutfileUrl: string | null; videoCrop?: unknown; videoTrim?: unknown },
  isLiked: boolean
): ComboDetailDTO {
  return {
    ...toComboListItem(c),
    description: c.description,
    tip: c.tip,
    gameSpecific: (c.gameSpecific as Record<string, unknown>) ?? {},
    videoUrl: c.videoUrl,
    videoCrop: parseVideoCrop(c.videoCrop),
    videoTrim: parseVideoTrim(c.videoTrim),
    tutfileUrl: c.tutfileUrl,
    isLiked,
  };
}

// videoCrop JSONB → 안전한 DTO. 형식 불일치 시 null.
function parseVideoCrop(raw: unknown): VideoCropDTO | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const isFrac = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
  if (!isFrac(r.x) || !isFrac(r.y) || !isFrac(r.w) || !isFrac(r.h)) return null;
  return {
    x: r.x,
    y: r.y,
    w: r.w,
    h: r.h,
    ...(typeof r.ratio === "string" && { ratio: r.ratio }),
  };
}

// videoTrim JSONB → 안전한 DTO. start/end 가 유효 숫자이고 start < end 일 때만 반환.
function parseVideoTrim(raw: unknown): VideoTrimDTO | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const { start, end } = r;
  if (typeof start !== "number" || !Number.isFinite(start) || start < 0) return null;
  if (typeof end !== "number" || !Number.isFinite(end) || end <= start) return null;
  return { start, end };
}
