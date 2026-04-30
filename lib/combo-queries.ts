import type { Prisma } from "@prisma/client";
import type { ComboListItemDTO, ComboDetailDTO, InputEntryDTO } from "@/lib/api/types";

export const COMBO_INCLUDE = {
  author: { select: { id: true, nickname: true, avatarUrl: true } },
  game:   { select: { slug: true, name: true } },
  character: { select: { slug: true, name: true, iconUrl: true } },
} satisfies Prisma.ComboInclude;

type ComboWithRelations = Prisma.ComboGetPayload<{ include: typeof COMBO_INCLUDE }>;

export function toComboListItem(c: ComboWithRelations): ComboListItemDTO {
  return {
    id: c.id,
    title: c.title,
    author: { ...c.author, nickname: c.author.nickname ?? "" },
    game: c.game,
    character: c.character,
    difficulty: c.difficulty as "easy" | "medium" | "hard",
    tags: c.tags,
    durationMs: c.durationMs,
    inputSummary: (c.inputSummary as unknown as InputEntryDTO[]) ?? [],
    thumbnailUrl: c.thumbnailUrl,
    likeCount: c.likeCount,
    downloadCount: c.downloadCount,
    viewCount: c.viewCount,
    patchVersion: c.patchVersion,
    createdAt: c.createdAt.toISOString(),
  };
}

export function toComboDetail(
  c: ComboWithRelations & { description: string | null; tip: string | null; gameSpecific: unknown; videoUrl: string | null; tutfileUrl: string | null },
  isLiked: boolean
): ComboDetailDTO {
  return {
    ...toComboListItem(c),
    description: c.description,
    tip: c.tip,
    gameSpecific: (c.gameSpecific as Record<string, unknown>) ?? {},
    videoUrl: c.videoUrl,
    tutfileUrl: c.tutfileUrl,
    isLiked,
  };
}
