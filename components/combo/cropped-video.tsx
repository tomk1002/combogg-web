"use client";

import { useEffect, useRef } from "react";
import type { VideoCropDTO, VideoTrimDTO } from "@/lib/api/types";

interface Props {
  videoUrl: string;
  thumbnailUrl: string | null;
  crop: VideoCropDTO | null;
  trim?: VideoTrimDTO | null;
  className?: string;
}

// Display-time video crop using CSS transform — no re-encoding.
// Display-time video trim using currentTime control — no re-encoding.
//
// Crop strategy:
//   - 외부 wrapper(아래 fragment 의 outer)는 부모가 결정 (aspect-video).
//   - crop 이 있으면 fragment 안에 absolute 로 박힌 inner-wrapper 가 화면을 덮음.
//   - inner <video> 를 (1/crop.w × 1/crop.h) 배율로 키우고 (-crop.x, -crop.y) 만큼 평행이동.
//     → crop 영역만 wrapper 안에 보임.
//
// Trim strategy:
//   - metadata 로드 시 currentTime = trim.start 로 점프.
//   - timeupdate 마다 currentTime >= trim.end 면 trim.start 로 되돌리고 일시 정지(loop 효과는
//     사용자가 다시 재생을 누르면 됨 — UI 단순함 우선).
//   - 사용자가 직접 trim.start 이전·trim.end 이후로 시킹할 수 있으나, 자동으로 다시 trim 범위로
//     되돌리지는 않는다 (시킹은 사용자 의도라고 가정).
export default function CroppedVideo({ videoUrl, thumbnailUrl, crop, trim, className }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // trim 효과: 메타데이터 로드 시 시작점 점프 + timeupdate 마다 끝점 체크
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !trim) return;

    const onLoaded = () => {
      // 메타데이터 로드 직후 currentTime 을 trim.start 로 (시도)
      try { v.currentTime = trim.start; } catch { /* noop */ }
    };
    const onTimeUpdate = () => {
      if (v.currentTime >= trim.end) {
        // 끝 도달 → 시작으로 되돌리고 정지
        try { v.currentTime = trim.start; } catch { /* noop */ }
        v.pause();
      }
    };

    v.addEventListener("loadedmetadata", onLoaded);
    v.addEventListener("timeupdate", onTimeUpdate);

    // 이미 metadata 가 로드된 경우 즉시 시작점으로 점프
    if (v.readyState >= 1 /* HAVE_METADATA */) {
      try { v.currentTime = trim.start; } catch { /* noop */ }
    }

    return () => {
      v.removeEventListener("loadedmetadata", onLoaded);
      v.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [trim]);

  if (!crop) {
    return (
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        preload={trim ? "metadata" : "none"}
        className={className ?? "w-full h-full object-cover"}
        poster={thumbnailUrl ?? undefined}
      />
    );
  }

  // 비디오는 부모 wrapper 의 100% 크기를 기준으로 (1/crop.w, 1/crop.h) 배 만큼 확대 후 이동.
  // top/left 가 음수 % 인 경우 — 비디오 자체 크기 대비가 아니라 부모 wrapper 대비 % 라
  // (-crop.x * 100 / crop.w) % 가 정확.
  //
  // object-cover: 비디오의 native aspect 를 유지하면서 wrapper 를 채움. wrapper aspect 와
  // crop region 의 aspect 가 일치하지 않으면 추가 crop 이 발생하지만, 이 컴포넌트의
  // 입력 단계에서 사용자가 이미 원하는 영역을 지정했으므로 일단 그대로 둔다.
  const innerStyle: React.CSSProperties = {
    position: "absolute",
    width: `${100 / crop.w}%`,
    height: `${100 / crop.h}%`,
    left: `${-crop.x * (100 / crop.w)}%`,
    top: `${-crop.y * (100 / crop.h)}%`,
  };

  return (
    <div className="absolute inset-0 overflow-hidden">
      <video
        ref={videoRef}
        src={videoUrl}
        controls
        preload={trim ? "metadata" : "none"}
        poster={thumbnailUrl ?? undefined}
        style={innerStyle}
        className="object-cover"
      />
    </div>
  );
}
