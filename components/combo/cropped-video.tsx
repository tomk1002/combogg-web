"use client";

import type { VideoCropDTO } from "@/lib/api/types";

interface Props {
  videoUrl: string;
  thumbnailUrl: string | null;
  crop: VideoCropDTO | null;
  className?: string;
}

// Display-time video crop using CSS transform — no re-encoding.
//
// Strategy:
//   - 외부 wrapper(아래 fragment 의 outer)는 부모가 결정 (aspect-video).
//   - crop 이 있으면 fragment 안에 absolute 로 박힌 inner-wrapper 가 화면을 덮음.
//   - inner <video> 를 (1/crop.w × 1/crop.h) 배율로 키우고 (-crop.x, -crop.y) 만큼 평행이동.
//     → crop 영역만 wrapper 안에 보임.
//
// 한계: 부모 wrapper 의 aspect-ratio (현재 aspect-video=16:9) 와 crop 의 aspect-ratio 가
// 다르면 영상이 letterbox 없이 wrapper 를 채우지 못하거나 약간 늘어남. 부모 컨테이너
// 의 aspect-ratio 는 page 측에서 비디오의 native aspect × crop.w/crop.h 로 맞추는 게 이상적.
// 일단 MVP 로는 부모가 aspect-video 인 채로 두고, object-cover 로 crop region 을 채움.
export default function CroppedVideo({ videoUrl, thumbnailUrl, crop, className }: Props) {
  if (!crop) {
    return (
      <video
        src={videoUrl}
        controls
        preload="none"
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
        src={videoUrl}
        controls
        preload="none"
        poster={thumbnailUrl ?? undefined}
        style={innerStyle}
        className="object-cover"
      />
    </div>
  );
}
