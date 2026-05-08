"use client";

import { useEffect, useRef, useState } from "react";
import type { VideoCropDTO, VideoTrimDTO } from "@/lib/api/types";

interface Props {
  videoUrl: string;
  thumbnailUrl: string | null;
  crop: VideoCropDTO | null;
  trim?: VideoTrimDTO | null;
}

// 레이아웃:
//   1. 외부 컨테이너 — 항상 16:9 (페이지 레이아웃 일관성)
//   2. 내부 frame — crop 영역의 픽셀 aspect 비율. 컨테이너 안에 letterbox 로 fit.
//   3. frame 안의 <video> — 100/cropW × 100/cropH 으로 transform 해서 crop 영역만 보임
//
// 이렇게 하면:
//   - 신규 16:9 crop: frame = 컨테이너 (letterbox 없음)
//   - 구 1:1·4:3·9:16 crop: frame 비율 유지하며 컨테이너 안에 letterbox 로 정확히 표시
//     (영상 자체는 추가 잘림 없이 사용자가 선택한 영역 그대로 보임)
//
// 주의:
//   - native HTML5 controls 바는 transform 후 frame 밖으로 밀려남 → 커스텀 play overlay 사용
//   - poster 도 같은 이유로 video element 에서 빼고 frame 사이즈로 별도 <img> underlay
export default function CroppedVideo({ videoUrl, thumbnailUrl, crop, trim }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nativeAspect, setNativeAspect] = useState<number | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);

  // native video aspect 측정 (frame 비율 계산용)
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

  // ── crop: letterbox frame inside 16:9 container ────────────
  // cropPixelAspect = native × (cropW/cropH) — 사용자가 잘라낸 영역의 실제 픽셀 비율
  const containerAspect = 16 / 9;
  const cropPixelAspect = nativeAspect != null ? nativeAspect * (crop.w / crop.h) : containerAspect;

  // Frame fit 전략 — 컨테이너(16:9) 안에 cropPixelAspect 로 비율 유지하며 fit:
  //   - cropPixelAspect >= 16/9 → 가로폭 채우고 위·아래 letterbox
  //   - cropPixelAspect < 16/9 → 세로 채우고 좌·우 letterbox
  const frameStyle: React.CSSProperties = {
    position: "relative",
    overflow: "hidden",
    aspectRatio: cropPixelAspect,
    width: cropPixelAspect >= containerAspect ? "100%" : "auto",
    height: cropPixelAspect < containerAspect ? "100%" : "auto",
  };

  const innerStyle: React.CSSProperties = {
    position: "absolute",
    width: `${100 / crop.w}%`,
    height: `${100 / crop.h}%`,
    left: `${-crop.x * (100 / crop.w)}%`,
    top: `${-crop.y * (100 / crop.h)}%`,
  };

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

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-black flex items-center justify-center">
      <div style={frameStyle}>
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
    </div>
  );
}
