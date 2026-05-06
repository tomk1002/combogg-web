"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import ComboCard from "@/components/combo/combo-card";
import DifficultyPips from "@/components/shared/difficulty-pips";
import { useLang } from "@/lib/i18n-client";
import type { ComboListItemDTO } from "@/lib/api/types";
import type { Difficulty } from "@/types";

interface Character {
  slug: string;
  name: string;
  iconUrl: string | null;
  comboCount: number;
}

interface Props {
  popularCombos: ComboListItemDTO[];
  newestCombos: ComboListItemDTO[];
  characters: Character[];
  difficultyCounts: Record<Difficulty, number>;
  difficultyGroups: Record<Difficulty, ComboListItemDTO[]>;
}

export default function HomeContent({ popularCombos, newestCombos, characters, difficultyCounts, difficultyGroups }: Props) {
  const { t } = useLang();
  const [selectedChamp, setSelectedChamp] = useState<string | null>(null);
  const [champSearch, setChampSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("easy");

  const champsWithCombos = useMemo(
    () => characters.filter((c) => c.comboCount > 0),
    [characters]
  );

  const filteredRailChamps = useMemo(() => {
    if (!champSearch.trim()) return champsWithCombos;
    const q = champSearch.toLowerCase();
    return characters.filter((c) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [champSearch, champsWithCombos, characters]);

  const filteredCombos = useMemo(
    () => selectedChamp ? popularCombos.filter((c) => c.character.slug === selectedChamp) : popularCombos,
    [selectedChamp, popularCombos]
  );

  const topChampTiles = useMemo(
    () => characters.filter((c) => c.comboCount > 0).slice(0, 8),
    [characters]
  );

  const trendingRef = useRef<HTMLDivElement>(null);
  const difficultyRef = useRef<HTMLDivElement>(null);
  const newestRef = useRef<HTMLDivElement>(null);
  const scrollRow = (ref: React.RefObject<HTMLDivElement | null>, dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * 340, behavior: "smooth" });

  const diffMeta: Record<Difficulty, { label: string; desc: string }> = {
    easy:   { label: t.diff_easy_label,   desc: t.diff_easy_desc },
    medium: { label: t.diff_medium_label, desc: t.diff_medium_desc },
    hard:   { label: t.diff_hard_label,   desc: t.diff_hard_desc },
  };

  return (
    <>
      {/* ── Champion Rail ─────────────────────────────────────────────── */}
      <div className="sticky top-[69px] z-30 bg-surface/[0.92] backdrop-blur-md border-b border-border">
        <div className="max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-3 flex items-center gap-3">
          <div className="relative shrink-0">
            <input
              type="text"
              value={champSearch}
              onChange={(e) => setChampSearch(e.target.value)}
              placeholder={t.rail_search}
              className="h-7 pl-7 pr-3 rounded-full border border-border bg-surface-overlay text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-gold/40 transition-colors w-24 sm:w-36"
            />
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0">
            <button
              onClick={() => { setSelectedChamp(null); setChampSearch(""); }}
              className={`h-7 px-3 rounded-full text-xs font-semibold shrink-0 border transition-colors cursor-pointer ${
                !selectedChamp ? "bg-gold text-bg border-gold" : "border-border text-text-secondary hover:text-text hover:border-gold/30"
              }`}
            >
              {t.rail_all}
            </button>
            {filteredRailChamps.map((c) => (
              <button
                key={c.slug}
                onClick={() => { setSelectedChamp(c.slug === selectedChamp ? null : c.slug); setChampSearch(""); }}
                className={`h-7 pl-1.5 pr-3 rounded-full text-xs font-semibold shrink-0 border flex items-center gap-1.5 transition-colors cursor-pointer ${
                  selectedChamp === c.slug
                    ? "bg-gold text-bg border-gold"
                    : "border-border text-text-secondary hover:text-text hover:border-gold/30"
                }`}
              >
                {c.iconUrl && (
                  <Image src={c.iconUrl} alt={c.name} width={18} height={18} className="rounded-sm shrink-0" />
                )}
                {c.name}
              </button>
            ))}
            {champSearch && filteredRailChamps.length === 0 && (
              <span className="text-xs text-text-muted px-2">{t.rail_no_results}</span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[var(--width-content)] mx-auto px-4 sm:px-8">
        {/* ── Trending ──────────────────────────────────────────────────── */}
        <section className="pt-8 pb-2">
          <div className="flex items-end justify-between mb-4 gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-block w-1 h-7 rounded-full bg-gradient-to-b from-[#F5DC74] to-[#C89B3C]" />
                <h2 className="text-2xl font-extrabold tracking-tight text-gradient-gold">
                  {selectedChamp
                    ? t.filtered_for(characters.find((c) => c.slug === selectedChamp)?.name ?? selectedChamp)
                    : t.trending_kicker}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 pb-1">
              <button type="button" onClick={() => scrollRow(trendingRef, -1)} className="hidden sm:flex w-6 h-6 items-center justify-center rounded text-text-muted hover:text-text hover:bg-surface-overlay transition-colors cursor-pointer">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 10L4 6l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button type="button" onClick={() => scrollRow(trendingRef, 1)} className="hidden sm:flex w-6 h-6 items-center justify-center rounded text-text-muted hover:text-text hover:bg-surface-overlay transition-colors cursor-pointer">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <Link href={selectedChamp ? `/games/lol/champions/${selectedChamp}` : "/games/lol"} className="text-sm text-text-secondary hover:text-gold transition-colors font-semibold ml-1">
                {t.view_all}
              </Link>
            </div>
          </div>

          {filteredCombos.length > 0 ? (
            <div ref={trendingRef} className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 sm:-mx-8 px-4 sm:px-8 pb-2">
              {filteredCombos.slice(0, 10).map((combo, i) => (
                <div key={combo.id} className="shrink-0 w-[260px] sm:w-[300px] lg:w-[320px]">
                  <ComboCard combo={combo} priority={i < 3} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-text-muted border border-dashed border-border rounded-xl">
              <p className="text-sm">{t.empty_champ_combos}</p>
            </div>
          )}
        </section>

        <div className="h-px my-8 bg-border" />

        {/* ── Browse by Champion ────────────────────────────────────────── */}
        {topChampTiles.length > 0 && (
          <section className="pb-2">
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="inline-block w-1 h-7 rounded-full bg-gradient-to-b from-[#F5DC74] to-[#C89B3C]" />
                <h2 className="text-2xl font-extrabold tracking-tight text-gradient-gold">{t.champ_kicker}</h2>
              </div>
              <p className="text-sm text-text-secondary">{t.champ_subtitle}</p>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {topChampTiles.map((c) => (
                <Link
                  key={c.slug}
                  href={`/games/lol/champions/${c.slug}`}
                  className="group flex flex-col items-center gap-1.5 p-2.5 rounded-lg border border-border bg-surface-raised hover:border-gold/30 hover:bg-surface-overlay transition-colors"
                >
                  {c.iconUrl ? (
                    <Image src={c.iconUrl} alt={c.name} width={36} height={36} className="rounded-md" />
                  ) : (
                    <div className="w-9 h-9 rounded-md bg-surface-overlay flex items-center justify-center text-base font-black text-text-muted">
                      {c.name[0]}
                    </div>
                  )}
                  <span className="text-xs font-medium text-center leading-tight text-text-secondary">
                    {c.name} <span className="text-text-muted">({c.comboCount})</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="h-px my-8 bg-border" />

        {/* ── Difficulty ────────────────────────────────────────────────── */}
        <section className="pb-2">
          <div className="flex items-end justify-between mb-4 gap-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="inline-block w-1 h-7 rounded-full bg-gradient-to-b from-[#F5DC74] to-[#C89B3C]" />
                <h2 className="text-2xl font-extrabold tracking-tight text-gradient-gold">{t.diff_kicker}</h2>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 pb-1">
              <button type="button" onClick={() => scrollRow(difficultyRef, -1)} className="hidden sm:flex w-6 h-6 items-center justify-center rounded text-text-muted hover:text-text hover:bg-surface-overlay transition-colors cursor-pointer">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 10L4 6l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button type="button" onClick={() => scrollRow(difficultyRef, 1)} className="hidden sm:flex w-6 h-6 items-center justify-center rounded text-text-muted hover:text-text hover:bg-surface-overlay transition-colors cursor-pointer">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <Link href={`/games/lol?difficulty=${selectedDifficulty}`} className="text-sm text-text-secondary hover:text-gold transition-colors font-semibold ml-1">
                {t.view_all}
              </Link>
            </div>
          </div>

          {/* 난이도 탭 */}
          <div className="flex gap-2 mb-4">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
              const meta = diffMeta[d];
              const count = difficultyCounts[d] ?? 0;
              const active = selectedDifficulty === d;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDifficulty(d)}
                  className={`flex items-center gap-2 h-9 px-4 rounded-full border text-sm font-bold transition-colors cursor-pointer ${
                    active
                      ? d === "easy"   ? "bg-easy/15 border-easy text-easy"
                      : d === "medium" ? "bg-medium/15 border-medium text-medium"
                      : "bg-hard/15 border-hard text-hard"
                      : "border-border text-text-secondary hover:border-[rgba(255,255,255,0.2)] hover:text-text"
                  }`}
                >
                  <DifficultyPips difficulty={d} />
                  <span>{meta.label}</span>
                  <span className={`text-xs font-mono ${active ? "opacity-70" : "text-text-muted"}`}>{count}</span>
                </button>
              );
            })}
          </div>

          {/* 선택된 난이도 콤보 */}
          {difficultyGroups[selectedDifficulty].length > 0 ? (
            <div ref={difficultyRef} className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 sm:-mx-8 px-4 sm:px-8 pb-2">
              {difficultyGroups[selectedDifficulty].map((combo) => (
                <div key={combo.id} className="shrink-0 w-[260px] sm:w-[300px] lg:w-[320px]">
                  <ComboCard combo={combo} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-text-muted border border-dashed border-border rounded-xl">
              <p className="text-sm">{t.diff_empty(diffMeta[selectedDifficulty].label)}</p>
            </div>
          )}
        </section>

        <div className="h-px my-8 bg-border" />

        {/* ── Newest ────────────────────────────────────────────────────── */}
        {newestCombos.length > 0 && (
          <section className="pb-2">
            <div className="flex items-end justify-between mb-4 gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <span className="inline-block w-1 h-7 rounded-full bg-gradient-to-b from-[#F5DC74] to-[#C89B3C]" />
                  <h2 className="text-2xl font-extrabold tracking-tight text-gradient-gold">{t.newest_kicker}</h2>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 pb-1">
                <button type="button" onClick={() => scrollRow(newestRef, -1)} className="hidden sm:flex w-6 h-6 items-center justify-center rounded text-text-muted hover:text-text hover:bg-surface-overlay transition-colors cursor-pointer">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8 10L4 6l4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <button type="button" onClick={() => scrollRow(newestRef, 1)} className="hidden sm:flex w-6 h-6 items-center justify-center rounded text-text-muted hover:text-text hover:bg-surface-overlay transition-colors cursor-pointer">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <Link href="/games/lol?sort=latest" className="text-sm text-text-secondary hover:text-gold transition-colors font-semibold ml-1">
                  {t.view_all}
                </Link>
              </div>
            </div>
            <div ref={newestRef} className="flex gap-3 overflow-x-auto scrollbar-none -mx-4 sm:-mx-8 px-4 sm:px-8 pb-2">
              {newestCombos.slice(0, 10).map((combo) => (
                <div key={combo.id} className="shrink-0 w-[260px] sm:w-[300px] lg:w-[320px]">
                  <ComboCard key={combo.id} combo={combo} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── CTA Strip ─────────────────────────────────────────────────── */}
        <section className="py-10">
          <div className="rounded-xl border border-border bg-surface-raised p-8 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="text-xs font-black tracking-widest text-gold mb-3">{t.cta_kicker}</div>
              <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight mb-3 whitespace-pre-line">
                {t.cta_title}
              </h3>
              <p className="text-text-secondary text-sm max-w-lg">{t.cta_subtitle}</p>
            </div>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-gold text-white font-bold text-sm hover:bg-gold-light transition-colors shrink-0"
            >
              {t.cta_button}
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M4 4l3 3-3 3M7 4l3 3-3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
