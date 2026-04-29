"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  comboId: string;
  initialIsLiked: boolean;
  initialLikeCount: number;
  tutfileUrl: string | null;
  isLoggedIn: boolean;
}

export default function ComboActions({ comboId, initialIsLiked, initialLikeCount, tutfileUrl, isLoggedIn }: Props) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleLike = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (isLiking) return;
    setIsLiking(true);
    // optimistic
    setIsLiked((p) => !p);
    setLikeCount((p) => isLiked ? p - 1 : p + 1);
    try {
      await fetch(`/api/combos/${comboId}/like`, { method: "POST" });
    } catch {
      // revert on failure
      setIsLiked((p) => !p);
      setLikeCount((p) => isLiked ? p + 1 : p - 1);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/combos/${comboId}/download`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      window.open(url, "_blank");
    } catch {
      alert("다운로드 링크를 가져올 수 없습니다.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isDownloading || !tutfileUrl}
        className="w-full h-12 rounded-xl bg-gold text-white font-bold text-sm shadow-[0_2px_8px_rgba(184,134,11,0.32)] hover:bg-gold-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
      >
        {isDownloading ? "준비 중..." : ".tutfile 다운로드"}
      </button>
      <button
        type="button"
        onClick={handleLike}
        disabled={isLiking}
        className={`w-full h-10 rounded-xl border font-semibold text-sm transition-colors cursor-pointer ${
          isLiked
            ? "border-gold/50 bg-gold/10 text-gold"
            : "border-border text-text-secondary hover:bg-surface-overlay hover:text-text"
        }`}
      >
        {isLiked ? `♥ 좋아요 ${likeCount}` : `♡ 좋아요 ${likeCount}`}
      </button>
    </div>
  );
}
