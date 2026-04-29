import Image from "next/image";
import Link from "next/link";
import DifficultyPips from "@/components/shared/difficulty-pips";
import { KeySequence, inputToKeySequence } from "@/components/shared/keycap";
import { formatCount, formatDuration, timeAgo } from "@/lib/utils";
import type { ComboListItemDTO } from "@/lib/api/types";

interface Props {
  combo: ComboListItemDTO;
  priority?: boolean;
}

export default function ComboCard({ combo, priority = false }: Props) {
  const keys = inputToKeySequence(combo.inputSummary);

  return (
    <Link
      href={`/combos/${combo.id}`}
      className="group flex flex-col bg-surface-raised border border-border rounded-xl overflow-hidden hover:border-[rgba(255,255,255,0.16)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.32)] transition-all duration-200"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface-overlay overflow-hidden">
        {combo.thumbnailUrl ? (
          <Image
            src={combo.thumbnailUrl}
            alt={combo.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : combo.character.iconUrl ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src={combo.character.iconUrl}
              alt={combo.character.name}
              width={72}
              height={72}
              className="rounded-full opacity-20"
            />
          </div>
        ) : null}

        {/* Duration badge */}
        {combo.durationMs && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 font-mono text-[10px] font-bold text-white">
            {formatDuration(combo.durationMs)}
          </span>
        )}

        {/* Difficulty */}
        <span className="absolute top-2 left-2">
          <DifficultyPips difficulty={combo.difficulty} />
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Champion + title */}
        <div className="flex items-start gap-2.5">
          {combo.character.iconUrl && (
            <Image
              src={combo.character.iconUrl}
              alt={combo.character.name}
              width={32}
              height={32}
              sizes="32px"
              className="rounded-md shrink-0 mt-0.5"
            />
          )}
          <div className="min-w-0">
            <p className="font-bold text-sm leading-snug line-clamp-2 text-text group-hover:text-gold transition-colors">
              {combo.title}
            </p>
            <p className="text-[11px] text-text-secondary mt-0.5">{combo.character.name}</p>
          </div>
        </div>

        {/* Key sequence preview */}
        {keys.length > 0 && (
          <KeySequence keys={keys} size="sm" maxKeys={7} />
        )}

        {/* Tags */}
        {combo.tags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {combo.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full bg-surface-overlay text-[10px] font-semibold text-text-secondary"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-[rgba(255,255,255,0.06)]">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-[9px] font-bold text-gold">
              {combo.author.nickname[0]?.toUpperCase()}
            </span>
            <span className="text-[11px] text-text-secondary">{combo.author.nickname}</span>
          </div>
          <div className="flex items-center gap-2.5 text-[11px] text-text-muted">
            <span className="flex items-center gap-0.5">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M8 2C4.5 2 2 5 2 8s2.5 6 6 6 6-3 6-6-2.5-6-6-6z" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M8 5v3l2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              {formatCount(combo.viewCount)}
            </span>
            <span className="flex items-center gap-0.5">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M8 2v8m0 0L5 7m3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {formatCount(combo.downloadCount)}
            </span>
            <span className="flex items-center gap-0.5">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M2 8c0-1.1 2.7-4 6-4s6 2.9 6 4-2.7 4-6 4-6-2.9-6-4z" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
              </svg>
              {formatCount(combo.likeCount)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
