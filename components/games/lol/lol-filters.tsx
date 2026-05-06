"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { useLang } from "@/lib/i18n-client";

interface Character { slug: string; name: string; }

interface Props {
  characters: Character[];
}

export default function LolFilters({ characters }: Props) {
  const router = useRouter();
  const sp = useSearchParams();
  const { t } = useLang();
  const [q, setQ] = useState(sp.get("q") ?? "");

  const difficultyOptions = [
    { label: t.lol_filter_difficulty_all, value: "" },
    { label: t.easy,                      value: "easy" },
    { label: t.medium,                    value: "medium" },
    { label: t.hard,                      value: "hard" },
  ];

  const sortOptions = [
    { label: t.lol_sort_latest,    value: "latest" },
    { label: t.lol_sort_popular,   value: "popular" },
    { label: t.lol_sort_downloads, value: "downloads" },
  ];

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
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t.lol_search_placeholder}
          className="flex-1 h-9 px-3 rounded-lg border border-border bg-surface-raised text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-gold/40 transition-colors"
        />
        <button
          type="submit"
          className="h-9 px-4 rounded-lg border border-border bg-surface-overlay text-sm font-semibold hover:bg-surface-raised transition-colors cursor-pointer"
        >
          {t.lol_search_btn}
        </button>
      </form>

      <div className="flex gap-2 flex-wrap items-center">
        <select
          value={sp.get("character") ?? ""}
          onChange={(e) => setParam("character", e.target.value)}
          className="h-9 px-3 rounded-lg border border-border bg-surface-raised text-sm text-text focus:outline-none focus:border-gold/40 transition-colors cursor-pointer"
        >
          <option value="">{t.lol_filter_champ_all}</option>
          {characters.map((c) => (
            <option key={c.slug} value={c.slug}>{c.name}</option>
          ))}
        </select>

        <select
          value={sp.get("difficulty") ?? ""}
          onChange={(e) => setParam("difficulty", e.target.value)}
          className="h-9 px-3 rounded-lg border border-border bg-surface-raised text-sm text-text focus:outline-none focus:border-gold/40 transition-colors cursor-pointer"
        >
          {difficultyOptions.map(({ label, value }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <div className="flex rounded-lg border border-border overflow-hidden ml-auto">
          {sortOptions.map(({ label, value }) => {
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
