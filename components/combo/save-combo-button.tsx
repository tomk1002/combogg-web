"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  comboId: string;
  initialIsSaved: boolean;
  isLoggedIn: boolean;
}

export default function SaveComboButton({ comboId, initialIsSaved, isLoggedIn }: Props) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (isPending) return;
    setIsPending(true);
    const prev = isSaved;
    setIsSaved(!prev);
    try {
      const res = await fetch("/api/users/me/saved-combos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comboId }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIsSaved(data.saved);
    } catch {
      setIsSaved(prev);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`w-full h-10 rounded-xl border font-semibold text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
        isSaved
          ? "border-gold/50 bg-gold/10 text-gold"
          : "border-border text-text-secondary hover:bg-surface-overlay hover:text-text"
      }`}
    >
      {isSaved ? (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          저장됨
        </>
      ) : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
          내 콤보에 추가
        </>
      )}
    </button>
  );
}
