"use client";

import { useState } from "react";

interface Props {
  comboId: string;
  isOwn?: boolean;
}

export default function ComboShareButton({ comboId, isOwn = false }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (copied) return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 클립보드 접근 불가 시 무시
    }
    if (!isOwn) {
      // 작성자에게 공유 알림 — 실패해도 무시
      fetch(`/api/combos/${comboId}/share`, { method: "POST" }).catch(() => {});
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="w-full h-10 rounded-xl border border-border font-semibold text-sm text-text-secondary hover:bg-surface-overlay hover:text-text transition-colors cursor-pointer flex items-center justify-center gap-1.5"
    >
      {copied ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          복사됨!
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          공유
        </>
      )}
    </button>
  );
}
