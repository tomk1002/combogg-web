import Image from "next/image";
import { notFound } from "next/navigation";
import DifficultyPips from "@/components/shared/difficulty-pips";
import { KeySequence, inputToKeySequence } from "@/components/shared/keycap";
import { formatCount, formatDuration, timeAgo } from "@/lib/utils";
import { prisma } from "@/lib/db";
import { COMBO_INCLUDE } from "@/lib/combo-queries";
import type { InputEntryDTO } from "@/lib/api/types";

interface Props { params: Promise<{ id: string }> }

export default async function ComboDetailPage({ params }: Props) {
  const { id } = await params;

  const combo = await prisma.combo.findUnique({ where: { id, status: "published" }, include: COMBO_INCLUDE });
  if (!combo) notFound();

  // 조회수 +1 (fire-and-forget)
  prisma.combo.update({ where: { id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  const inputSummary = (combo.inputSummary as unknown as InputEntryDTO[]) ?? [];
  const keys = inputToKeySequence(inputSummary);
  const gameSpecific = (combo.gameSpecific as unknown as Record<string, unknown>) ?? {};

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-8 py-10 w-full">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        {/* Left */}
        <div className="flex flex-col gap-6">
          {/* Video */}
          <div className="relative aspect-video bg-surface-overlay rounded-xl overflow-hidden border border-border">
            {combo.thumbnailUrl ? (
              <Image src={combo.thumbnailUrl} alt={combo.title} fill className="object-cover" />
            ) : combo.character.iconUrl ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Image src={combo.character.iconUrl} alt={combo.character.name} width={96} height={96} className="rounded-full opacity-20" />
              </div>
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-black/50 border border-[rgba(255,255,255,0.16)] flex items-center justify-center text-white">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-2">
              <DifficultyPips difficulty={combo.difficulty} />
              {combo.patchVersion && <span className="text-[11px] text-text-muted font-semibold">패치 {combo.patchVersion}</span>}
            </div>
            <h1 className="text-2xl font-black tracking-tight mb-3">{combo.title}</h1>
            {combo.description && <p className="text-text-secondary text-sm mb-3 leading-relaxed">{combo.description}</p>}
            <div className="flex items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold">
                  {combo.author.nickname[0]?.toUpperCase()}
                </span>
                {combo.author.nickname}
              </span>
              <span>{timeAgo(combo.createdAt)}</span>
            </div>
          </div>

          {keys.length > 0 && (
            <div className="bg-surface-raised rounded-xl p-5 border border-border">
              <h2 className="text-xs font-bold mb-4 text-text-secondary uppercase tracking-wide">입력 시퀀스</h2>
              <KeySequence keys={keys} size="md" maxKeys={12} />
            </div>
          )}

          {combo.tags.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {combo.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 rounded-full bg-surface-overlay border border-border text-xs font-semibold text-text-secondary">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right */}
        <div className="flex flex-col gap-4">
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

          <div className="bg-surface-raised rounded-xl p-5 border border-border">
            <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-3">통계</h2>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: "좋아요",    value: formatCount(combo.likeCount) },
                { label: "다운로드",  value: formatCount(combo.downloadCount) },
                { label: "조회",      value: formatCount(combo.viewCount) },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-lg font-black">{value}</p>
                  <p className="text-[10px] text-text-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {combo.durationMs && (
            <div className="bg-surface-raised rounded-xl p-5 border border-border">
              <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-1">길이</h2>
              <p className="text-2xl font-black font-mono">{formatDuration(combo.durationMs)}</p>
            </div>
          )}

          <button className="w-full h-12 rounded-xl bg-gold text-white font-bold text-sm shadow-[0_2px_8px_rgba(184,134,11,0.32)] hover:bg-gold-light transition-colors cursor-pointer">
            .tutfile 다운로드
          </button>
          <button className="w-full h-10 rounded-xl border border-border text-text-secondary font-semibold text-sm hover:bg-surface-overlay hover:text-text transition-colors cursor-pointer">
            좋아요
          </button>
        </div>
      </div>
    </main>
  );
}
