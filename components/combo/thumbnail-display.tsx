"use client";

import Image from "next/image";

// 컨테이너 비율은 16:9 고정 (썸네일 crop 도 16:9 만 허용).
// 기존에 다른 비율로 저장된 썸네일은 object-cover 로 중앙 정렬되며 가장자리가 약간 잘릴 수 있음.
export default function ThumbnailDisplay({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative w-full aspect-video overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="(min-width: 1024px) 60vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}
