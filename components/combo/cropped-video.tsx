"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoCropDTO, VideoTrimDTO } from "@/lib/api/types";

interface Props {
  videoUrl: string;
  thumbnailUrl: string | null;
  crop: VideoCropDTO | null;
  trim?: VideoTrimDTO | null;
}

// 컨테이너 비율은 16:9 고정 (crop overlay 도 16:9 만 허용).
//
// Crop transform (display-time, 재인코딩 X):
//   - inner <video> 를 (1/crop.w × 1/crop.h) 배율로 키우고 (-crop.x, -crop.y) 만큼 평행이동
//   - 컨테이너 overflow-hidden 으로 crop 영역만 보임
//
// Native HTML5 controls 바는 transform 후 컨테이너 밖으로 밀려나므로 crop 시엔 제거하고
// 커스텀 click-to-play overlay 사용. poster 속성도 같은 이유로 제거하고 별도 <img> underlay
// 로 표시 (재생 시작하면 hide).
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

  // ── crop: 썸네일 underlay + transformed video + 커스텀 play 버튼 ───
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
