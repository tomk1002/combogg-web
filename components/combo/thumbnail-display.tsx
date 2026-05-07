"use client";

import { useState } from "react";
import Image from "next/image";

// 썸네일 단독 표시 — 자체 client component 로 분리한 이유:
//   사용자가 썸네일을 4:3, 1:1 등 비표준 aspect 로 crop 했을 수 있음.
//   서버에선 이미지 native dims 를 모르므로 client 에서 onLoad 로 측정해
//   컨테이너 aspect 를 자동 맞춤. 그렇지 않으면 16:9 컨테이너 + object-cover 에서
//   이미지가 다시 잘려 보임.
export default function ThumbnailDisplay({ src, alt }: { src: string; alt: string }) {
  const [aspect, setAspect] = useState<number | null>(null);
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ aspectRatio: aspect ?? 16 / 9 }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover"
        onLoad={(e) => {
          const img = e.currentTarget;
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            setAspect(img.naturalWidth / img.naturalHeight);
          }
        }}
      />
    </div>
  );
}
