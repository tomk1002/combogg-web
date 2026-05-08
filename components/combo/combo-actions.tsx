"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  comboId: string;
  initialIsLiked: boolean;
  initialLikeCount: number;
  isLoggedIn: boolean;
  compact?: boolean;
}

export default function ComboActions({ comboId, initialIsLiked, initialLikeCount, isLoggedIn, compact = false }: Props) {
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (isLiking) return;
    setIsLiking(true);
    const prevLiked = isLiked;
    setIsLiked(!prevLiked);
    setLikeCount((p) => prevLiked ? p - 1 : p + 1);
    try {
      const res = await fetch(`/api/combos/${comboId}/like`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIsLiked(data.liked);
    } catch {
      setIsLiked(prevLiked);
      setLikeCount((p) => prevLiked ? p + 1 : p - 1);
    } finally {
      setIsLiking(false);
    }
  };

  const sizing = compact
    ? "h-9 px-4 rounded-full text-xs"
    : "w-full h-10 rounded-xl text-sm";

  return (
    <button
      type="button"
      onClick={handleLike}
      disabled={isLiking}
      className={`${sizing} border font-semibold transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5 ${
        isLiked
          ? "border-gold/50 bg-gold/10 text-gold"
          : "border-border text-text-secondary hover:bg-surface-overlay hover:text-text"
      }`}
    >
      <span aria-hidden>{isLiked ? "♥" : "♡"}</span>
      <span className="tabular-nums">{likeCount}</span>
    </button>
  );
}
