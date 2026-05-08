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
import ReportButton from "@/components/combo/report-button";
import SaveComboButton from "@/components/combo/save-combo-button";
import CroppedVideo from "@/components/combo/cropped-video";
import ThumbnailDisplay from "@/components/combo/thumbnail-display";
import { formatCount, formatDuration, timeAgo, authorDisplayName } from "@/lib/utils";
import type { InputEntryDTO, CommentDTO, VideoCropDTO, VideoTrimDTO } from "@/lib/api/types";
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
  const videoCrop = parseVideoCropForPage(combo.videoCrop);
  const videoTrim = parseVideoTrimForPage(combo.videoTrim);
  const isLiked = !!isLikedRecord;
  const isSaved = !!isSavedRecord;

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-6 sm:py-10 w-full">
      <div className="max-w-[1024px] mx-auto flex flex-col gap-5">

        {/* Video / thumbnail */}
        <div className="relative bg-surface-overlay rounded-xl overflow-hidden">
          {combo.videoUrl ? (
            <CroppedVideo
              videoUrl={combo.videoUrl}
              thumbnailUrl={combo.thumbnailUrl}
              crop={videoCrop}
              trim={videoTrim}
            />
          ) : combo.thumbnailUrl ? (
            <ThumbnailDisplay src={combo.thumbnailUrl} alt={combo.title} />
          ) : (
            <div className="aspect-video flex items-center justify-center relative">
              {combo.character.iconUrl && (
                <Image src={combo.character.iconUrl} alt={combo.character.name} width={96} height={96} className="rounded-full opacity-20" />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/50 border border-[rgba(255,255,255,0.16)] flex items-center justify-center text-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="text-2xl font-black tracking-tight">{combo.title}</h1>

        {/* Meta + Action bar — youtube style. author·stats 좌측, action buttons 우측. wrap on small screens. */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-xs font-bold text-gold shrink-0">
              {authorDisplayName(combo.author)[0]?.toUpperCase()}
            </span>
            <span className="font-semibold">{authorDisplayName(combo.author)}</span>
            <span className="text-text-muted">·</span>
            <span className="text-xs text-text-muted">
              {formatCount(combo.viewCount)} views · {formatCount(saveCount)} saves · {timeAgo(combo.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ComboActions
              comboId={id}
              initialIsLiked={isLiked}
              initialLikeCount={combo.likeCount}
              isLoggedIn={!!userId}
              compact
            />
            <SaveComboButton comboId={id} initialIsSaved={isSaved} isLoggedIn={!!userId} compact />
            <ComboShareButton comboId={id} isOwn={combo.authorId === userId} compact />
          </div>
        </div>

        {/* Description + tip — 있을 때만, 배경 없이 텍스트만 */}
        {(combo.description || combo.tip) && (
          <div className="text-sm text-text-secondary leading-relaxed flex flex-col gap-2">
            {combo.description && <p>{combo.description}</p>}
            {combo.tip && (
              <p className="border-l-2 border-gold/40 pl-3 whitespace-pre-wrap">{combo.tip}</p>
            )}
          </div>
        )}

        {/* 통합 정보 카드 — Champion + 난이도 + 패치 + 조건 (레벨/AH/AS/소환사주문/아이템/스킬) */}
        <div className="bg-surface-raised rounded-xl border border-border p-5 flex flex-col gap-5">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              {combo.character.iconUrl && (
                <Image src={combo.character.iconUrl} alt={combo.character.name} width={44} height={44} className="rounded-lg" />
              )}
              <div>
                <p className="font-bold">{combo.character.name}</p>
                <p className="text-xs text-text-muted">{combo.game.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DifficultyPips difficulty={combo.difficulty} />
              {combo.patchVersion && (
                <span className="text-xs text-text-muted font-semibold">{t.lol_patch_label(combo.patchVersion)}</span>
              )}
            </div>
          </div>

          {combo.game.slug === "lol" && (
            <LolConditions gameSpecific={gameSpecific} patch={combo.patchVersion ?? undefined} />
          )}
        </div>

        {/* Input sequence */}
        {keys.length > 0 && (
          <div>
            <h2 className="text-xs font-bold mb-3 text-text-secondary uppercase tracking-wide">{t.detail_input_seq}</h2>
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
              <span key={tag} className="px-3 py-1 rounded-full border border-border-subtle text-xs font-semibold text-text-muted">
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Comments — streamed */}
        <Suspense fallback={
          <div>
            <div className="h-4 w-16 bg-surface-overlay rounded animate-pulse mb-4" />
            <div className="space-y-3">
              {[1,2].map(i => <div key={i} className="h-12 bg-surface-overlay rounded-lg animate-pulse" />)}
            </div>
          </div>
        }>
          <CommentsSection comboId={id} currentUserId={userId} />
        </Suspense>

        {/* Related — streamed */}
        <Suspense fallback={null}>
          <RelatedCombosSection
            characterId={combo.characterId}
            comboId={id}
            characterName={combo.character.name}
            t={t}
          />
        </Suspense>

        {/* Footer actions: report (non-owner) / author actions (owner) — 페이지 맨 아래 */}
        {combo.authorId !== userId && (
          <div className="flex justify-end pt-2">
            <ReportButton targetType="combo" targetId={id} />
          </div>
        )}
        {combo.authorId === userId && (
          <ComboAuthorActions comboId={id} />
        )}
      </div>
    </main>
  );
}

// ── helpers ────────────────────────────────────────────────────────

function parseVideoCropForPage(raw: unknown): VideoCropDTO | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const isFrac = (v: unknown): v is number =>
    typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= 1;
  if (!isFrac(r.x) || !isFrac(r.y) || !isFrac(r.w) || !isFrac(r.h)) return null;
  return {
    x: r.x, y: r.y, w: r.w, h: r.h,
    ...(typeof r.ratio === "string" && { ratio: r.ratio }),
  };
}

function parseVideoTrimForPage(raw: unknown): VideoTrimDTO | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const { start, end } = r;
  if (typeof start !== "number" || !Number.isFinite(start) || start < 0) return null;
  if (typeof end !== "number" || !Number.isFinite(end) || end <= start) return null;
  return { start, end };
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
    <ComboComments comboId={comboId} initialComments={initialComments} currentUserId={currentUserId} />
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
