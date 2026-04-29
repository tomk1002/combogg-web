"use client";

import { useState, useMemo } from "react";
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
}

export default function HomeContent({ popularCombos, newestCombos, characters, difficultyCounts }: Props) {
  const { t } = useLang();
  const [selectedChamp, setSelectedChamp] = useState<string | null>(null);
  const [champSearch, setChampSearch] = useState("");

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

  const diffMeta: Record<Difficulty, { label: string; desc: string }> = {
    easy:   { label: t.diff_easy_label,   desc: t.diff_easy_desc },
    medium: { label: t.diff_medium_label, desc: t.diff_medium_desc },
    hard:   { label: t.diff_hard_label,   desc: t.diff_hard_desc },
  };

  return (
    <>
      {/* ── Champion Rail ─────────────────────────────────────────────── */}
      <div className="sticky top-[69px] z-30 bg-[rgba(15,17,21,0.92)] backdrop-blur-md border-b border-border">
        <div className="max-w-[var(--width-content)] mx-auto px-8 py-3 flex items-center gap-3">
          <span className="text-[10px] font-black tracking-widest text-text-muted shrink-0">{t.rail_label}</span>

          <div className="relative shrink-0">
            <input
              type="text"
              value={champSearch}
              onChange={(e) => setChampSearch(e.target.value)}
              placeholder={t.rail_search}
              className="h-7 pl-7 pr-3 rounded-full border border-border bg-surface-overlay text-xs focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors w-36"
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
                !selectedChamp ? "bg-gold text-bg border-gold" : "border-border text-text-secondary hover:text-text hover:border-[rgba(255,255,255,0.2)]"
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
                    : "border-border text-text-secondary hover:text-text hover:border-[rgba(255,255,255,0.2)]"
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

      <div className="max-w-[var(--width-content)] mx-auto px-8">
        {/* ── Trending ──────────────────────────────────────────────────── */}
        <section className="pt-12 pb-4">
          <div className="flex items-end justify-between mb-6 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-6 h-0.5 bg-gold rounded" />
                <span className="text-[10px] font-black tracking-widest text-gold">{t.trending_kicker}</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                {selectedChamp
                  ? t.filtered_for(characters.find((c) => c.slug === selectedChamp)?.name ?? selectedChamp)
                  : t.trending_title}
              </h2>
            </div>
            <Link href={selectedChamp ? `/games/lol/champions/${selectedChamp}` : "/games/lol"} className="text-sm text-text-secondary hover:text-gold transition-colors font-semibold shrink-0 pb-1">
              {t.view_all}
            </Link>
          </div>

          {filteredCombos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCombos.slice(0, 6).map((combo, i) => (
                <ComboCard key={combo.id} combo={combo} priority={i < 3} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-text-muted border border-dashed border-border rounded-xl">
              <p className="text-sm">{t.empty_champ_combos}</p>
            </div>
          )}
        </section>

        <div className="h-px my-12 bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── Browse by Champion ────────────────────────────────────────── */}
        {topChampTiles.length > 0 && (
          <section className="pb-4">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-6 h-0.5 bg-[#4a90e2] rounded" />
                <span className="text-[10px] font-black tracking-widest text-[#4a90e2]">{t.champ_kicker}</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">{t.champ_title}</h2>
              <p className="text-sm text-text-secondary mt-1">{t.champ_subtitle}</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {topChampTiles.map((c) => (
                <Link
                  key={c.slug}
                  href={`/games/lol/champions/${c.slug}`}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-border bg-surface-raised hover:border-[rgba(255,255,255,0.2)] hover:bg-surface-overlay transition-colors"
                >
                  {c.iconUrl ? (
                    <Image src={c.iconUrl} alt={c.name} width={48} height={48} className="rounded-lg" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-surface-overlay flex items-center justify-center text-lg font-black text-text-muted">
                      {c.name[0]}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-center leading-tight">{c.name}</span>
                  <span className="text-[10px] text-text-muted font-mono">{c.comboCount}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="h-px my-12 bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── Difficulty ────────────────────────────────────────────────── */}
        <section className="pb-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-6 h-0.5 bg-easy rounded" />
              <span className="text-[10px] font-black tracking-widest text-easy">{t.diff_kicker}</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">{t.diff_title}</h2>
            <p className="text-sm text-text-secondary mt-1">{t.diff_subtitle}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
              const meta = diffMeta[d];
              const count = difficultyCounts[d] ?? 0;
              return (
                <Link
                  key={d}
                  href={`/games/lol?difficulty=${d}`}
                  className="group p-5 rounded-xl border border-border bg-surface-raised hover:bg-surface-overlay transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <DifficultyPips difficulty={d} />
                    <svg className="text-text-muted group-hover:text-text transition-colors group-hover:translate-x-1 transition-transform" width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M4 4l4 4-4 4M8 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="text-base font-extrabold tracking-tight mb-1">{meta.label}</div>
                  <div className="text-xs text-text-secondary leading-relaxed">{meta.desc}</div>
                  <div className="mt-4 pt-3 border-t border-dashed border-border text-[11px] font-mono text-text-muted">
                    <strong className="text-text text-sm">{count}</strong> {t.combos_unit}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="h-px my-12 bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── Newest ────────────────────────────────────────────────────── */}
        {newestCombos.length > 0 && (
          <section className="pb-4">
            <div className="flex items-end justify-between mb-6 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block w-6 h-0.5 bg-[#9c6fe4] rounded" />
                  <span className="text-[10px] font-black tracking-widest text-[#9c6fe4]">{t.newest_kicker}</span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">{t.newest_title}</h2>
              </div>
              <Link href="/games/lol?sort=latest" className="text-sm text-text-secondary hover:text-gold transition-colors font-semibold shrink-0 pb-1">
                {t.view_all}
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {newestCombos.map((combo) => (
                <ComboCard key={combo.id} combo={combo} />
              ))}
            </div>
          </section>
        )}

        {/* ── CTA Strip ─────────────────────────────────────────────────── */}
        <section className="py-16">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-surface-raised to-bg border border-border p-12 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-8 items-center">
            <div aria-hidden className="absolute inset-0 opacity-30 pointer-events-none"
              style={{ backgroundImage: "radial-gradient(rgba(232,198,121,0.08) 1px, transparent 1px)", backgroundSize: "16px 16px" }} />
            <div className="relative">
              <div className="text-[10px] font-black tracking-widest text-gold mb-3">{t.cta_kicker}</div>
              <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight mb-3 whitespace-pre-line">
                {t.cta_title}
              </h3>
              <p className="text-text-secondary text-sm max-w-lg">{t.cta_subtitle}</p>
            </div>
            <Link
              href="/upload"
              className="relative inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-gold text-white font-bold text-sm shadow-[0_6px_20px_rgba(184,134,11,0.4)] hover:bg-gold-light transition-colors shrink-0"
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
