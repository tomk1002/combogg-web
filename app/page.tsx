import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";
import HomeContent from "@/components/home/home-content";
import { getT } from "@/lib/i18n";
import type { Difficulty } from "@/types";

export const revalidate = 60;

const getHomeData = unstable_cache(async function getHomeData() {
  const [popularRaw, newestRaw, characters, diffGroups] = await Promise.all([
    prisma.combo.findMany({
      where: { status: "published" },
      include: COMBO_INCLUDE,
      orderBy: { likeCount: "desc" },
      take: 20,
    }),
    prisma.combo.findMany({
      where: { status: "published" },
      include: COMBO_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.character.findMany({
      where: { game: { slug: "lol" } },
      include: { _count: { select: { combos: { where: { status: "published" } } } } },
      orderBy: [{ name: "asc" }],
    }),
    prisma.combo.groupBy({
      by: ["difficulty"],
      where: { status: "published" },
      _count: { id: true },
    }),
  ]);

  const difficultyCounts = { easy: 0, medium: 0, hard: 0 } as Record<Difficulty, number>;
  for (const g of diffGroups) {
    difficultyCounts[g.difficulty as Difficulty] = g._count.id;
  }

  const characterList = characters
    .map((c) => ({ slug: c.slug, name: c.name, iconUrl: c.iconUrl, comboCount: c._count.combos }))
    .sort((a, b) => b.comboCount - a.comboCount || a.name.localeCompare(b.name));

  return {
    popularCombos: popularRaw.map(toComboListItem),
    newestCombos: newestRaw.map(toComboListItem),
    characters: characterList,
    difficultyCounts,
    featuredCombo: popularRaw.length > 0 ? toComboListItem(popularRaw[0]) : null,
  };
}, ["home-data"], { revalidate: 60 });

export default async function Home() {
  const { popularCombos, newestCombos, characters, difficultyCounts, featuredCombo } = await getHomeData();
  const t = getT("ko");

  return (
    <main className="flex-1">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border">
        <div aria-hidden className="absolute inset-0 opacity-60 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
        <div aria-hidden className="absolute right-[-150px] top-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(184,134,11,0.15) 0%, transparent 60%)" }} />

        <div className="relative max-w-[var(--width-content)] mx-auto px-8 py-16 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-14 items-center">
          {/* Left */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-muted border border-gold/40 text-[11px] font-bold text-gold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              {t.hero_badge}
            </div>
            <h1 className="text-4xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
              {t.hero_title1}<br />
              <span className="text-gold">{t.hero_title2}</span>
            </h1>
            <p className="text-text-secondary text-base lg:text-lg mb-8 max-w-lg">
              {t.hero_subtitle}
            </p>
            <div className="flex gap-3">
              <Link href="/upload" className="inline-flex items-center gap-2 h-11 px-6 rounded-[8px] bg-gold text-white font-bold text-sm shadow-[0_2px_8px_rgba(184,134,11,0.32)] hover:bg-gold-light transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 11V3m0 0L4 6m3-3 3 3M2 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t.hero_share}
              </Link>
              <Link href="/download" className="inline-flex items-center gap-2 h-11 px-6 rounded-[8px] border border-[rgba(255,255,255,0.12)] text-text-secondary font-bold text-sm hover:bg-surface-overlay hover:text-text transition-colors">
                {t.hero_download}
              </Link>
            </div>
          </div>

          {/* Right — featured combo card */}
          {featuredCombo && (
            <Link
              href={`/combos/${featuredCombo.id}`}
              className="group relative rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.12)] bg-surface-raised hover:-translate-y-1 transition-transform shadow-[0_30px_80px_rgba(0,0,0,0.5),0_0_0_1px_rgba(232,198,121,0.12)]"
            >
              <div className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold text-bg text-[10px] font-black tracking-widest">
                <svg width="8" height="8" viewBox="0 0 10 10" fill="currentColor">
                  <path d="M5 0l1.4 3.2L10 4 7 6.4 8 10 5 8 2 10l1-3.6L0 4l3.6-.8L5 0z"/>
                </svg>
                {t.spotlight}
              </div>

              <div className="relative aspect-video bg-surface-overlay">
                {featuredCombo.thumbnailUrl ? (
                  <Image src={featuredCombo.thumbnailUrl} alt={featuredCombo.title} fill priority sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[140px] font-black italic text-white/10 leading-none select-none">
                      {featuredCombo.character.name[0]}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#1A1D24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                </div>
                {featuredCombo.durationMs && (
                  <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded bg-black/70 text-white text-[11px] font-mono font-bold">
                    {Math.floor(featuredCombo.durationMs / 60000)}:{String(Math.floor((featuredCombo.durationMs % 60000) / 1000)).padStart(2, "0")}
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {featuredCombo.character.iconUrl && (
                    <Image src={featuredCombo.character.iconUrl} alt={featuredCombo.character.name} width={20} height={20} className="rounded" />
                  )}
                  <span className="text-xs font-bold">{featuredCombo.character.name}</span>
                  <span className="text-[11px] text-text-muted font-mono ml-auto">↓ {featuredCombo.downloadCount.toLocaleString()}</span>
                </div>
                <h3 className="text-base font-bold tracking-tight">{featuredCombo.title}</h3>
              </div>
            </Link>
          )}
        </div>
      </section>

      {/* ── Interactive sections (champion filter, difficulty, newest, CTA) ── */}
      <HomeContent
        popularCombos={popularCombos}
        newestCombos={newestCombos}
        characters={characters}
        difficultyCounts={difficultyCounts}
      />
    </main>
  );
}
