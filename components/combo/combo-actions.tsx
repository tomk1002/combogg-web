"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";

interface Props {
  comboId: string;
  initialIsLiked: boolean;
  initialLikeCount: number;
  tutfileUrl: string | null;
  isLoggedIn: boolean;
}

export default function ComboActions({ comboId, initialIsLiked, initialLikeCount, tutfileUrl, isLoggedIn }: Props) {
  const router = useRouter();
  const { t } = useLang();
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleLike = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (isLiking) return;
    setIsLiking(true);
    const prevLiked = isLiked;
    // optimistic
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

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const res = await fetch(`/api/combos/${comboId}/download`, { method: "POST" });
      if (!res.ok) throw new Error();
      const { url } = await res.json();
      window.open(url, "_blank");
    } catch {
      alert(t.detail_download_fail);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {/* Primary: like */}
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

      {/* Secondary: small text-only .tutfile export link */}
      {tutfileUrl && (
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full h-8 inline-flex items-center justify-center gap-1.5 text-xs font-medium text-text-muted hover:text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title={t.download_export_tutfile}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
            <path d="M8 2v8m0 0L5 7m3 3 3-3M3 13h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {isDownloading ? t.detail_downloading : t.download_export_tutfile}
        </button>
      )}
    </div>
  );
}
