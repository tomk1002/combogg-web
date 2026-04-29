"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HeaderSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/games/lol?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-[540px] relative">
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      >
        <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.4" />
        <path d="m11 11 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="콤보, 챔피언, 작성자 검색..."
        className="w-full h-10 pl-9 pr-12 rounded-lg border border-[rgba(255,255,255,0.08)] bg-surface-overlay text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors"
      />
      <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface border border-[rgba(255,255,255,0.08)] font-mono text-[10px] font-bold text-text-muted pointer-events-none">
        ⌘K
      </span>
    </form>
  );
}
