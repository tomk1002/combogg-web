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
export default function CroppedVideo({ videoUrl, thumbnailUrl, crop, trim }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nativeAspect, setNativeAspect] = useState<number | null>(null);

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
    if (nativeAspect == null) return 16 / 9; // fallback
    if (!crop) return nativeAspect;
    return nativeAspect * (crop.w / crop.h);
  })();

  if (!crop) {
    return (
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: containerAspect }}>
        <video
          ref={videoRef}
          src={videoUrl}
          controls
          preload={trim ? "metadata" : "none"}
          poster={thumbnailUrl ?? undefined}
          className="absolute inset-0 w-full h-full"
        />
      </div>
    );
  }

  const innerStyle: React.CSSProperties = {
    position: "absolute",
    width: `${100 / crop.w}%`,
    height: `${100 / crop.h}%`,
    left: `${-crop.x * (100 / crop.w)}%`,
    top: `${-crop.y * (100 / crop.h)}%`,
  };

  return (
    <div className="relative w-full overflow-hidden" style={{ aspectRatio: containerAspect }}>
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        preload={trim ? "metadata" : "none"}
        poster={thumbnailUrl ?? undefined}
        style={innerStyle}
      />
    </div>
  );
}
