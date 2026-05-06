"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

function HeaderSearchInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  // Sync input when URL searchParams change (e.g. navigating back/forward)
  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (pathname === "/games/lol") {
      const params = new URLSearchParams(searchParams.toString());
      if (trimmed) {
        params.set("q", trimmed);
      } else {
        params.delete("q");
      }
      // Reset to page 1 when searching
      params.delete("page");
      router.push(`/games/lol?${params.toString()}`);
    } else {
      if (trimmed) {
        router.push(`/games/lol?q=${encodeURIComponent(trimmed)}`);
      }
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
        className="w-full h-10 pl-9 pr-4 rounded-lg border border-[rgba(255,255,255,0.08)] bg-surface-overlay text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-[rgba(255,255,255,0.24)] transition-colors"
      />
    </form>
  );
}

export default function HeaderSearch() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 max-w-[540px] h-10 rounded-lg border border-[rgba(255,255,255,0.08)] bg-surface-overlay animate-pulse" />
      }
    >
      <HeaderSearchInner />
    </Suspense>
  );
}
