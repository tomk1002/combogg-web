"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLang } from "@/lib/i18n-client";

interface Props {
  comboId: string;
  initialIsSaved: boolean;
  isLoggedIn: boolean;
}

export default function SaveComboButton({ comboId, initialIsSaved, isLoggedIn }: Props) {
  const router = useRouter();
  const { t } = useLang();
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    if (isPending) return;
    setIsPending(true);
    const prev = isSaved;
    // optimistic
    setIsSaved(!prev);
    try {
      const res = await fetch(`/api/combos/${comboId}/save`, { method: "POST" });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setIsSaved(!!data.saved);
    } catch {
      // revert on failure
      setIsSaved(prev);
    } finally {
      setIsPending(false);
    }
  };

  // Logged-out — show login-aware button
  if (!isLoggedIn) {
    return (
      <button
        type="button"
        onClick={handleToggle}
        className="w-full h-12 rounded-xl border border-border font-bold text-sm text-text-secondary hover:bg-surface-overlay hover:text-text transition-colors cursor-pointer flex items-center justify-center gap-1.5"
      >
        <BookmarkIcon filled={false} />
        {t.save_login}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      aria-pressed={isSaved}
      className={`w-full h-12 rounded-xl font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed ${
        isSaved
          ? "bg-gold text-white shadow-[0_2px_8px_rgba(184,134,11,0.32)] hover:bg-gold-light"
          : "border border-border text-text-secondary hover:bg-surface-overlay hover:text-text"
      }`}
    >
      <BookmarkIcon filled={isSaved} />
      {isSaved ? t.save_saved : t.save_add}
    </button>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}
