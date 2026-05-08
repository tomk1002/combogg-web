"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoCropDTO, VideoTrimDTO } from "@/lib/api/types";

interface Props {
  videoUrl: string;
  thumbnailUrl: string | null;
  crop: VideoCropDTO | null;
  trim?: VideoTrimDTO | null;
}

// Display-time video crop using CSS transform (no re-encoding).
// Display-time video trim using currentTime control (no re-encoding).
//
// Aspect ratio:
//   - 컨테이너의 aspect = native video aspect × (crop.w / crop.h) (crop 있을 때)
//   - 또는 native video aspect (crop 없을 때)
//   - native dims 가 로드되기 전까지는 16:9 fallback
//
// Crop transform:
//   - inner <video> 를 (1/crop.w × 1/crop.h) 배율로 키우고 (-crop.x, -crop.y) 만큼 평행이동.
//     → crop 영역만 wrapper 안에 보임.
//   - 단, native HTML5 controls 바가 video element 의 맨 아래에 있어 transform 후엔
//     컨테이너 밖으로 밀려나서 사용자가 못 봄. 그래서 crop 시엔 controls 제거하고
//     커스텀 play overlay 사용.
//   - poster 속성은 video element 자체의 transform 영향을 받아 잘려 보임 →
//     poster 대신 컨테이너 사이즈에 맞춘 별도 <img> 를 underlay 로 표시.
//     video 재생 시작하면 숨김.
export default function CroppedVideo({ videoUrl, thumbnailUrl, crop, trim }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nativeAspect, setNativeAspect] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false); // 한 번이라도 재생 시작했는지 (썸네일 underlay hide)

  // native video aspect 측정
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onLoaded = () => {
      if (v.videoWidth > 0 && v.videoHeight > 0) {
        setNativeAspect(v.videoWidth / v.videoHeight);
      }
    };
    v.addEventListener("loadedmetadata", onLoaded);
    if (v.readyState >= 1 && v.videoWidth > 0 && v.videoHeight > 0) {
      setNativeAspect(v.videoWidth / v.videoHeight);
    }
    return () => v.removeEventListener("loadedmetadata", onLoaded);
  }, [videoUrl]);

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

  // 컨테이너 aspect ratio 결정
  const containerAspect = (() => {
    if (nativeAspect == null) return 16 / 9;
    if (!crop) return nativeAspect;
    return nativeAspect * (crop.w / crop.h);
  })();

  // ── no crop: native controls + native poster ──────────────
  if (!crop) {
    return (
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: containerAspect }}>
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

  // ── crop: poster underlay + transformed video + custom play button ───
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
    <div className="relative w-full overflow-hidden bg-black" style={{ aspectRatio: containerAspect }}>
      {/* 썸네일 underlay — 컨테이너 사이즈로 표시. 재생 시작 후엔 숨김. */}
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
