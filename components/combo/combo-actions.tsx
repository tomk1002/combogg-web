"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  comboId: string;
  initialIsLiked: boolean;
  initialLikeCount: number;
  isLoggedIn: boolean;
}

export default function ComboActions({ comboId, initialIsLiked, initialLikeCount, isLoggedIn }: Props) {
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

  return (
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
      {isLiked ? `♥ ${likeCount}` : `♡ ${likeCount}`}
    </button>
  );
}
