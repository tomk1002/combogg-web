"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import ComboCard from "@/components/combo/combo-card";
import DifficultyPips from "@/components/shared/difficulty-pips";
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

const DIFFICULTY_META: Record<Difficulty, { label: string; desc: string; color: string }> = {
  easy:   { label: "입문 · Beginner",      desc: "기본 스킬 콤보. 오늘 배우면 오늘 사용할 수 있습니다.",          color: "var(--color-easy)" },
  medium: { label: "중급 · Intermediate",  desc: "플래시·아이템 연계 등 정확한 타이밍이 필요합니다.",            color: "var(--color-medium)" },
  hard:   { label: "고급 · Advanced",      desc: "프레임 단위 입력. 충분한 연습이 필요합니다.",                  color: "var(--color-hard)" },
};

export default function HomeContent({ popularCombos, newestCombos, characters, difficultyCounts }: Props) {
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

  return (
    <>
      {/* ── Champion Rail ─────────────────────────────────────────────── */}
      <div className="sticky top-[69px] z-30 bg-[rgba(15,17,21,0.92)] backdrop-blur-md border-b border-border">
        <div className="max-w-[var(--width-content)] mx-auto px-8 py-3 flex items-center gap-3">
          <span className="text-[10px] font-black tracking-widest text-text-muted shrink-0">CHAMPION</span>

          {/* Search input */}
          <div className="relative shrink-0">
            <input
              type="text"
              value={champSearch}
              onChange={(e) => setChampSearch(e.target.value)}
              placeholder="챔피언 검색..."
              className="h-7 pl-7 pr-3 rounded-full border border-border bg-surface-overlay text-xs focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors w-36"
            />
            <svg className="absolute left-2 top-1/2 -translate-y-1/2 text-text-muted" width="12" height="12" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M16.5 16.5L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-1 min-w-0">
            <button
              onClick={() => { setSelectedChamp(null); setChampSearch(""); }}
              className={`h-7 px-3 rounded-full text-xs font-semibold shrink-0 border transition-colors cursor-pointer ${
                !selectedChamp ? "bg-gold text-bg border-gold" : "border-border text-text-secondary hover:text-text hover:border-[rgba(255,255,255,0.2)]"
              }`}
            >
              전체
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
              <span className="text-xs text-text-muted px-2">콤보 없음</span>
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
                <span className="text-[10px] font-black tracking-widest text-gold">TRENDING NOW</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">
                {selectedChamp
                  ? `${characters.find((c) => c.slug === selectedChamp)?.name} — 인기 콤보`
                  : "이번 주 가장 많이 좋아요된 콤보"}
              </h2>
            </div>
            <Link href={selectedChamp ? `/games/lol/champions/${selectedChamp}` : "/games/lol"} className="text-sm text-text-secondary hover:text-gold transition-colors font-semibold shrink-0 pb-1">
              전체 보기 →
            </Link>
          </div>

          {filteredCombos.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCombos.slice(0, 6).map((combo) => (
                <ComboCard key={combo.id} combo={combo} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-text-muted border border-dashed border-border rounded-xl">
              <p className="text-sm">선택한 챔피언의 콤보가 없습니다</p>
            </div>
          )}
        </section>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="h-px my-12 bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── Browse by Champion ────────────────────────────────────────── */}
        {topChampTiles.length > 0 && (
          <section className="pb-4">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-block w-6 h-0.5 bg-[#4a90e2] rounded" />
                <span className="text-[10px] font-black tracking-widest text-[#4a90e2]">BROWSE BY CHAMPION</span>
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">챔피언별 콤보</h2>
              <p className="text-sm text-text-secondary mt-1">플레이하는 챔피언을 선택하면 인기 콤보부터 볼 수 있습니다.</p>
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

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="h-px my-12 bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── Difficulty ────────────────────────────────────────────────── */}
        <section className="pb-4">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-6 h-0.5 bg-easy rounded" />
              <span className="text-[10px] font-black tracking-widest text-easy">BY SKILL LEVEL</span>
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight">실력에 맞는 콤보 찾기</h2>
            <p className="text-sm text-text-secondary mt-1">처음 배우는 사람부터 프로 지망생까지, 단계별로 분류된 콤보.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {(["easy", "medium", "hard"] as Difficulty[]).map((d) => {
              const meta = DIFFICULTY_META[d];
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
                    <strong className="text-text text-sm">{count}</strong> 콤보
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Divider ───────────────────────────────────────────────────── */}
        <div className="h-px my-12 bg-gradient-to-r from-transparent via-border to-transparent" />

        {/* ── Newest ────────────────────────────────────────────────────── */}
        {newestCombos.length > 0 && (
          <section className="pb-4">
            <div className="flex items-end justify-between mb-6 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block w-6 h-0.5 bg-[#9c6fe4] rounded" />
                  <span className="text-[10px] font-black tracking-widest text-[#9c6fe4]">FRESHLY UPLOADED</span>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">새로 올라온 콤보</h2>
              </div>
              <Link href="/games/lol?sort=latest" className="text-sm text-text-secondary hover:text-gold transition-colors font-semibold shrink-0 pb-1">
                전체 보기 →
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
              <div className="text-[10px] font-black tracking-widest text-gold mb-3">─── SHARE YOUR COMBO</div>
              <h3 className="text-2xl lg:text-3xl font-extrabold tracking-tight leading-tight mb-3">
                당신만의 콤보가 있나요?<br />지금 바로 공유해보세요.
              </h3>
              <p className="text-text-secondary text-sm max-w-lg">
                데스크톱 앱에서 녹화한 .tutfile을 업로드하면 끝. 제목, 설명, 난이도만 입력하면 1분 안에 게시됩니다.
              </p>
            </div>
            <Link
              href="/upload"
              className="relative inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-gold text-white font-bold text-sm shadow-[0_6px_20px_rgba(184,134,11,0.4)] hover:bg-gold-light transition-colors shrink-0"
            >
              업로드 시작하기
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
