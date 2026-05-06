"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

interface Character { slug: string; name: string; }

interface Props {
  characters: Character[];
}

const DIFFICULTY_OPTIONS = [
  { label: "전체 난이도", value: "" },
  { label: "쉬움",       value: "easy" },
  { label: "보통",       value: "medium" },
  { label: "어려움",     value: "hard" },
];

const SORT_OPTIONS = [
  { label: "최신순",      value: "latest" },
  { label: "인기순",      value: "popular" },
  { label: "다운로드순",  value: "downloads" },
];

export default function LolFilters({ characters }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    router.push(`/games/lol?${params.toString()}`);
  }, [sp, router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParam("q", q.trim());
  };

  const currentSort = sp.get("sort") ?? "latest";

  return (
    <div className="flex flex-col gap-3">
      {/* 검색 */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="콤보 제목 검색..."
          className="flex-1 h-9 px-3 rounded-lg border border-border bg-surface-raised text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-gold/40 transition-colors"
        />
        <button
          type="submit"
          className="h-9 px-4 rounded-lg border border-border bg-surface-overlay text-sm font-semibold hover:bg-surface-raised transition-colors cursor-pointer"
        >
          검색
        </button>
      </form>

      {/* 필터 + 정렬 */}
      <div className="flex gap-2 flex-wrap items-center">
        {/* 챔피언 */}
        <select
          value={sp.get("character") ?? ""}
          onChange={(e) => setParam("character", e.target.value)}
          className="h-9 px-3 rounded-lg border border-border bg-surface-raised text-sm text-text focus:outline-none focus:border-gold/40 transition-colors cursor-pointer"
        >
          <option value="">전체 챔피언</option>
          {characters.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>

        {/* 난이도 */}
        <select
          value={sp.get("difficulty") ?? ""}
          onChange={(e) => setParam("difficulty", e.target.value)}
          className="h-9 px-3 rounded-lg border border-border bg-surface-raised text-sm text-text focus:outline-none focus:border-gold/40 transition-colors cursor-pointer"
        >
          {DIFFICULTY_OPTIONS.map(({ label, value }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        {/* 정렬 */}
        <div className="flex rounded-lg border border-border overflow-hidden ml-auto">
          {SORT_OPTIONS.map(({ label, value }) => {
            const active = currentSort === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setParam("sort", value === "latest" ? "" : value)}
                className={`h-9 px-3 text-sm font-semibold transition-colors cursor-pointer ${
                  active
                    ? "bg-surface-overlay text-text"
                    : "text-text-secondary hover:bg-surface-overlay hover:text-text"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
