"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import DifficultyPips from "@/components/shared/difficulty-pips";
import { KeySequence, inputToKeySequence } from "@/components/shared/keycap";
import { formatCount, authorDisplayName } from "@/lib/utils";
import type { ComboListItemDTO } from "@/lib/api/types";

interface Props {
  combo: ComboListItemDTO;
  priority?: boolean;
}

export default function ComboCard({ combo, priority = false }: Props) {
  const keys = inputToKeySequence(combo.inputSummary, combo.patchVersion);
  const videoRef = useRef<HTMLVideoElement>(null);

  const onEnter = () => {
    const v = videoRef.current;
    if (!v) return;
    // preload="none" 이므로 play() 호출 시점에 네트워크 요청 시작
    v.play()
      .then(() => { v.style.opacity = "1"; })
      .catch(() => {});
  };

  const onLeave = () => {
    const v = videoRef.current;
    if (!v) return;
    v.style.opacity = "0";
    // fade-out 완료 후 정지·되감기 (0.35s transition과 맞춤)
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }, 350);
  };

  return (
    <Link
      href={`/combos/${combo.id}`}
      onMouseEnter={combo.videoUrl ? onEnter : undefined}
      onMouseLeave={combo.videoUrl ? onLeave : undefined}
      className="group flex flex-col bg-surface-raised border border-border rounded-xl overflow-hidden hover:border-gold/50 hover:-translate-y-1 hover:shadow-[0_8px_28px_rgba(200,155,60,0.22),0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200"
    >
      {/* Thumbnail + video overlay */}
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

        {/* hover 시 페이드인되는 비디오 오버레이 — videoCrop 있으면 transform 으로 crop 적용 */}
        {combo.videoUrl && (
          <video
            ref={videoRef}
            src={combo.videoUrl}
            muted
            loop
            playsInline
            preload="none"
            style={
              combo.videoCrop
                ? {
                    opacity: 0,
                    transition: "opacity 0.35s ease",
                    position: "absolute",
                    width: `${100 / combo.videoCrop.w}%`,
                    height: `${100 / combo.videoCrop.h}%`,
                    left: `${-combo.videoCrop.x * (100 / combo.videoCrop.w)}%`,
                    top: `${-combo.videoCrop.y * (100 / combo.videoCrop.h)}%`,
                  }
                : { opacity: 0, transition: "opacity 0.35s ease" }
            }
            className={
              combo.videoCrop
                ? "object-cover pointer-events-none"
                : "absolute inset-0 w-full h-full object-cover pointer-events-none"
            }
          />
        )}

        {/* Difficulty badge */}
        <span className="absolute top-2 left-2 z-10 inline-flex items-center px-2 py-0.5 rounded-full bg-black/55 backdrop-blur-sm">
          <DifficultyPips difficulty={combo.difficulty} forceDark />
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col gap-3 p-4 flex-1">
        {/* Champion + title */}
        <div className="flex items-center gap-2.5">
          {combo.character.iconUrl && (
            <Image
              src={combo.character.iconUrl}
              alt={combo.character.name}
              width={32}
              height={32}
              sizes="32px"
              className="rounded-md shrink-0"
            />
          )}
          <p className="font-bold text-sm leading-snug line-clamp-2 text-text group-hover:text-gold transition-colors duration-200 min-w-0">
            {combo.title}
          </p>
        </div>

        {/* Key sequence preview */}
        {keys.length > 0 && (
          <KeySequence keys={keys} size="sm" maxKeys={7} />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-border-subtle">
          <div className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-[9px] font-bold text-gold">
              {authorDisplayName(combo.author)[0]?.toUpperCase()}
            </span>
            <span className="text-xs text-text-secondary truncate max-w-[100px]">{authorDisplayName(combo.author)}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-text-muted tabular-nums">
            <span className="flex items-center gap-0.5">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M2 8c0-1.1 2.7-4 6-4s6 2.9 6 4-2.7 4-6 4-6-2.9-6-4z" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
              </svg>
              {formatCount(combo.viewCount)}
            </span>
            <span className="flex items-center gap-0.5">
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                <path d="M14 6c0 4.5-6 8-6 8S2 10.5 2 6a4 4 0 0 1 6-3.46A4 4 0 0 1 14 6z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              </svg>
              {formatCount(combo.likeCount)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
