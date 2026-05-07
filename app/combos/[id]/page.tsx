import Image from "next/image";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";
import DifficultyPips from "@/components/shared/difficulty-pips";
import { KeySequence, inputToKeySequence } from "@/components/shared/keycap";
import LolConditions from "@/components/games/lol/lol-conditions";
import ComboActions from "@/components/combo/combo-actions";
import ComboComments from "@/components/combo/combo-comments";
import ComboCard from "@/components/combo/combo-card";
import ComboAuthorActions from "@/components/combo/combo-author-actions";
import ComboShareButton from "@/components/combo/combo-share-button";
import SaveComboButton from "@/components/combo/save-combo-button";
import { formatCount, formatDuration, timeAgo, authorDisplayName } from "@/lib/utils";
import type { InputEntryDTO, CommentDTO } from "@/lib/api/types";
import type { LolGameSpecific } from "@/lib/games/lol/schema";
import { getServerT } from "@/lib/i18n-server";
import type { T } from "@/lib/i18n";

export const revalidate = 30;

interface Props { params: Promise<{ id: string }> }

// React cache() — generateMetadata와 페이지 컴포넌트가 같은 요청 안에서 결과 공유
// status 필터를 페이지 레벨에서 — 작성자 본인은 draft도 볼 수 있어야 함 (편집 후 미리보기 등).
// 단, removed는 무조건 차단.
const getCombo = cache(async (id: string) =>
  prisma.combo.findUnique({
    where: { id, status: { in: ["published", "featured", "draft"] } },
    include: COMBO_INCLUDE,
  })
);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const combo = await getCombo(id);
  if (!combo) return {};
  const title = `${combo.title} — ${combo.character.name} | combo.gg`;
  const desc = combo.description ?? `${combo.character.name} 콤보`;
  return {
    title,
    description: desc,
    openGraph: {
      title,
      description: desc,
      images: combo.thumbnailUrl
        ? [{ url: combo.thumbnailUrl, width: 1280, height: 720, alt: combo.title }]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: combo.thumbnailUrl ? [combo.thumbnailUrl] : [],
    },
  };
}

export default async function ComboDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id ?? null;

  const combo = await getCombo(id);
  if (!combo) notFound();
  // draft는 작성자만 볼 수 있음 — 비-작성자에겐 notFound 위장
  if (combo.status === "draft" && combo.authorId !== userId) notFound();

  // 좋아요·저장 여부 + 저장 카운트 병렬 조회 (댓글·관련 콤보는 Suspense로 스트리밍)
  const [isLikedRecord, isSavedRecord, saveCount] = await Promise.all([
    userId
      ? prisma.like.findUnique({ where: { userId_comboId: { userId, comboId: id } } })
      : null,
    userId
      ? prisma.savedCombo.findUnique({ where: { userId_comboId: { userId, comboId: id } } })
      : null,
    prisma.savedCombo.count({ where: { comboId: id } }),
  ]);

  // 조회수 +1 (fire-and-forget)
  prisma.combo.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const t = await getServerT();

  const inputSummary = (combo.inputSummary as unknown as InputEntryDTO[]) ?? [];
  const keys = inputToKeySequence(inputSummary, combo.patchVersion);
  const gameSpecific = (combo.gameSpecific as unknown as Partial<LolGameSpecific>) ?? {};
  const isLiked = !!isLikedRecord;
  const isSaved = !!isSavedRecord;

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-6 sm:py-10 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

        {/* ── Right (챔피언·통계·액션) — 모바일에서 먼저 표시 ── */}
        <div className="flex flex-col gap-4 order-first lg:order-last">

          {/* Champion */}
          <div className="bg-surface-raised rounded-xl p-5 border border-border">
            <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">{t.detail_champion}</h2>
            <div className="flex items-center gap-3">
              {combo.character.iconUrl && (
                <Image src={combo.character.iconUrl} alt={combo.character.name} width={48} height={48} className="rounded-lg" />
              )}
              <div>
                <p className="font-bold">{combo.character.name}</p>
                <p className="text-xs text-text-secondary">{combo.game.name}</p>
              </div>
            </div>
          </div>

          {/* LoL conditions */}
          {combo.game.slug === "lol" && (
            <LolConditions gameSpecific={gameSpecific} patch={combo.patchVersion ?? undefined} />
          )}

          {/* Stats */}
          <div className="bg-surface-raised rounded-xl p-5 border border-border">
            <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">{t.detail_stats}</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: t.detail_stat_likes, value: formatCount(combo.likeCount) },
                { label: t.detail_stat_saves, value: formatCount(saveCount) },
                { label: t.detail_stat_views, value: formatCount(combo.viewCount) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-lg font-black">{value}</p>
                  <p className="text-xs text-text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Save to my library — primary CTA */}
          <SaveComboButton comboId={id} initialIsSaved={isSaved} isLoggedIn={!!userId} />

          {/* Like */}
          <ComboActions
            comboId={id}
            initialIsLiked={isLiked}
            initialLikeCount={combo.likeCount}
            isLoggedIn={!!userId}
          />

          {/* Share */}
          <ComboShareButton comboId={id} isOwn={combo.authorId === userId} />

          {/* Author actions */}
          {combo.authorId === userId && (
            <ComboAuthorActions comboId={id} />
          )}
        </div>

        {/* ── Left (영상·제목·시퀀스·댓글·관련) ── */}
        <div className="flex flex-col gap-6 order-last lg:order-first">

          {/* Video */}
          <div className="relative aspect-video bg-surface-overlay rounded-xl overflow-hidden border border-border">
            {combo.videoUrl ? (
              <video
                src={combo.videoUrl}
                controls
                preload="none"
                className="w-full h-full object-cover"
                poster={combo.thumbnailUrl ?? undefined}
              />
            ) : combo.thumbnailUrl ? (
              <Image src={combo.thumbnailUrl} alt={combo.title} fill className="object-cover" />
            ) : combo.character.iconUrl ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Image src={combo.character.iconUrl} alt={combo.character.name} width={96} height={96} className="rounded-full opacity-20" />
              </div>
            ) : null}
            {!combo.videoUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/50 border border-[rgba(255,255,255,0.16)] flex items-center justify-center text-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            )}
          </div>

          {/* Title / meta */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <DifficultyPips difficulty={combo.difficulty} />
              {combo.patchVersion && (
                <span className="text-xs text-text-muted font-semibold">{t.lol_patch_label(combo.patchVersion)}</span>
              )}
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-3">{combo.title}</h1>
            {combo.description && (
              <p className="text-text-secondary text-sm mb-2 leading-relaxed">{combo.description}</p>
            )}
            {combo.tip && (
              <p className="text-text-secondary text-sm mb-3 leading-relaxed whitespace-pre-wrap border-l-2 border-gold/40 pl-3">{combo.tip}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold">
                  {authorDisplayName(combo.author)[0]?.toUpperCase()}
                </span>
                {authorDisplayName(combo.author)}
              </span>
              <span>{timeAgo(combo.createdAt)}</span>
            </div>
          </div>

          {/* Input sequence */}
          {keys.length > 0 && (
            <div className="bg-surface-raised rounded-xl p-5 border border-border">
              <h2 className="text-xs font-bold mb-4 text-text-secondary uppercase tracking-wide">{t.detail_input_seq}</h2>
              <KeySequence keys={keys} size="md" maxKeys={12} />
              <p className="text-xs text-text-muted mt-2">
                {t.detail_input_count(combo.inputCount)}
                {combo.durationMs ? ` · ${formatDuration(combo.durationMs)}` : ""}
              </p>
            </div>
          )}

          {/* Tags */}
          {combo.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {combo.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-surface-overlay border border-border text-xs font-semibold text-text-secondary">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Comments — streamed */}
          <Suspense fallback={
            <div className="bg-surface-raised rounded-xl p-5 border border-border">
              <div className="h-4 w-16 bg-surface-overlay rounded animate-pulse mb-4" />
              <div className="space-y-3">
                {[1,2].map(i => <div key={i} className="h-12 bg-surface-overlay rounded-lg animate-pulse" />)}
              </div>
            </div>
          }>
            <CommentsSection comboId={id} currentUserId={userId} />
          </Suspense>

          {/* Related combos — streamed */}
          <Suspense fallback={null}>
            <RelatedCombosSection
              characterId={combo.characterId}
              comboId={id}
              characterName={combo.character.name}
              t={t}
            />
          </Suspense>
        </div>

      </div>
    </main>
  );
}

// ── Streaming sections ────────────────────────────────────────────

async function CommentsSection({ comboId, currentUserId }: { comboId: string; currentUserId: string | null }) {
  const commentsRaw = await prisma.comment.findMany({
    where: { comboId },
    include: { user: { select: { id: true, nickname: true, avatarUrl: true, riotGameName: true, riotTagLine: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const initialComments: CommentDTO[] = commentsRaw.map((c) => ({
    id: c.id,
    content: c.content,
    author: { id: c.user.id, nickname: c.user.nickname ?? "", avatarUrl: c.user.avatarUrl, riotGameName: c.user.riotGameName, riotTagLine: c.user.riotTagLine },
    createdAt: c.createdAt.toISOString(),
  }));
  return (
    <div className="bg-surface-raised rounded-xl p-5 border border-border">
      <ComboComments comboId={comboId} initialComments={initialComments} currentUserId={currentUserId} />
    </div>
  );
}

async function RelatedCombosSection({ characterId, comboId, characterName, t }: {
  characterId: string;
  comboId: string;
  characterName: string;
  t: T;
}) {
  const relatedRaw = await prisma.combo.findMany({
    where: { characterId, status: "published", id: { not: comboId } },
    include: COMBO_INCLUDE,
    orderBy: { likeCount: "desc" },
    take: 6,
  });
  if (relatedRaw.length === 0) return null;
  const items = relatedRaw.map(toComboListItem);
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">
        {t.detail_related(characterName)}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((c) => <ComboCard key={c.id} combo={c} />)}
      </div>
    </div>
  );
}
