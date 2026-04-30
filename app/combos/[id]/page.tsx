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
import { formatCount, formatDuration, timeAgo } from "@/lib/utils";
import type { InputEntryDTO, CommentDTO } from "@/lib/api/types";
import type { LolGameSpecific } from "@/lib/games/lol/schema";

export const revalidate = 30;

interface Props { params: Promise<{ id: string }> }

// React cache() — generateMetadata와 페이지 컴포넌트가 같은 요청 안에서 결과 공유
const getCombo = cache(async (id: string) =>
  prisma.combo.findUnique({ where: { id, status: "published" }, include: COMBO_INCLUDE })
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

  // 좋아요 여부만 여기서 확인 (댓글·관련 콤보는 Suspense로 스트리밍)
  const isLikedRecord = userId
    ? await prisma.like.findUnique({ where: { userId_comboId: { userId, comboId: id } } })
    : null;

  // 조회수 +1 (fire-and-forget)
  prisma.combo.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const inputSummary = (combo.inputSummary as unknown as InputEntryDTO[]) ?? [];
  const keys = inputToKeySequence(inputSummary);
  const gameSpecific = (combo.gameSpecific as unknown as Partial<LolGameSpecific>) ?? {};
  const isLiked = !!isLikedRecord;

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-6 sm:py-10 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

        {/* ── Right (챔피언·통계·액션) — 모바일에서 먼저 표시 ── */}
        <div className="flex flex-col gap-4 order-first lg:order-last">

          {/* Champion */}
          <div className="bg-surface-raised rounded-xl p-5 border border-border">
            <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">챔피언</h2>
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
            <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">통계</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "좋아요",   value: formatCount(combo.likeCount) },
                { label: "다운로드", value: formatCount(combo.downloadCount) },
                { label: "조회",     value: formatCount(combo.viewCount) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-lg font-black">{value}</p>
                  <p className="text-[10px] text-text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <ComboActions
            comboId={id}
            initialIsLiked={isLiked}
            initialLikeCount={combo.likeCount}
            tutfileUrl={combo.tutfileUrl}
            isLoggedIn={!!userId}
          />

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
                <span className="text-[11px] text-text-muted font-semibold">패치 {combo.patchVersion}</span>
              )}
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-3">{combo.title}</h1>
            {combo.description && (
              <p className="text-text-secondary text-sm mb-3 leading-relaxed">{combo.description}</p>
            )}
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold">
                  {(combo.author.nickname ?? "?")[0]?.toUpperCase()}
                </span>
                {combo.author.nickname ?? "unknown"}
              </span>
              <span>{timeAgo(combo.createdAt)}</span>
            </div>
          </div>

          {/* Input sequence */}
          {keys.length > 0 && (
            <div className="bg-surface-raised rounded-xl p-5 border border-border">
              <h2 className="text-xs font-bold mb-4 text-text-secondary uppercase tracking-wide">입력 시퀀스</h2>
              <KeySequence keys={keys} size="md" maxKeys={12} />
              <p className="text-[11px] text-text-muted mt-2">
                총 {combo.inputCount}개 입력
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
    include: { user: { select: { id: true, nickname: true, avatarUrl: true } } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  const initialComments: CommentDTO[] = commentsRaw.map((c) => ({
    id: c.id,
    content: c.content,
    author: { id: c.user.id, nickname: c.user.nickname ?? "", avatarUrl: c.user.avatarUrl },
    createdAt: c.createdAt.toISOString(),
  }));
  return (
    <div className="bg-surface-raised rounded-xl p-5 border border-border">
      <ComboComments comboId={comboId} initialComments={initialComments} currentUserId={currentUserId} />
    </div>
  );
}

async function RelatedCombosSection({ characterId, comboId, characterName }: {
  characterId: string;
  comboId: string;
  characterName: string;
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
        {characterName} 다른 콤보
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((c) => <ComboCard key={c.id} combo={c} />)}
      </div>
    </div>
  );
}
