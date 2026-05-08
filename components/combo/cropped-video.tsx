"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoCropDTO, VideoTrimDTO } from "@/lib/api/types";

interface Props {
  videoUrl: string;
  thumbnailUrl: string | null;
  crop: VideoCropDTO | null;
  trim?: VideoTrimDTO | null;
}

// 컨테이너는 항상 16:9 (페이지 레이아웃 일관성).
// crop transform — inner <video> 를 (1/cropW × 1/cropH) 배율로 키우고 (-cropX, -cropY) 만큼 평행이동
// → crop 영역만 컨테이너 안에 보임.
//
// 신규 16:9 crop + 16:9 native: pixel-perfect.
// 비-16:9 crop 또는 비-16:9 native: video 가 inner 박스 비율에 object-cover 되어 약간 추가 잘림.
//
// 주의: native HTML5 controls / poster 는 transform 후 가시영역 밖으로 밀려나므로
// crop 케이스에서 제거하고 커스텀 play overlay + 별도 thumbnail underlay 사용.
export default function CroppedVideo({ videoUrl, thumbnailUrl, crop, trim }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  // trim 효과
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !trim) return;

    const onLoaded = () => {
      try { v.currentTime = trim.start; } catch { /* noop */ }
    };
    const onTimeUpdate = () => {
      if (v.currentTime >= trim.end) {
        try { v.currentTime = trim.start; } catch { /* noop */ }
        v.pause();
      }
    };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTimeUpdate);

    if (v.readyState >= 1) {
      try { v.currentTime = trim.start; } catch { /* noop */ }
    }

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [trim]);

  // ── no crop: native controls + native poster ──────────────
  if (!crop) {
    return (
      <div className="relative w-full aspect-video overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          preload="metadata"
          poster={thumbnailUrl ?? undefined}
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    );
  }

  // ── crop: thumbnail underlay + transformed video + 커스텀 play 버튼 ───
  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => { setPlaying(true); setStarted(true); }).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const innerStyle: React.CSSProperties = {
    position: "absolute",
    width: `${100 / crop.w}%`,
    height: `${100 / crop.h}%`,
    left: `${-crop.x * (100 / crop.w)}%`,
    top: `${-crop.y * (100 / crop.h)}%`,
  };

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-black">
      {thumbnailUrl && !started && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}
      <video
        ref={videoRef}
        src={videoUrl}
        preload="metadata"
        style={innerStyle}
        className="object-cover pointer-events-none"
        onPlay={() => { setPlaying(true); setStarted(true); }}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <button
        type="button"
        onClick={togglePlay}
        aria-label={playing ? "일시정지" : "재생"}
        className="absolute inset-0 flex items-center justify-center cursor-pointer group"
      >
        {!playing && (
          <span className="w-16 h-16 rounded-full bg-black/60 group-hover:bg-black/75 border border-white/20 flex items-center justify-center text-white transition-colors">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}
      </button>
    </div>
  );
}
