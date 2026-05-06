import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";
import HomeContent from "@/components/home/home-content";
import { getT } from "@/lib/i18n";
import type { Difficulty } from "@/types";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "combo.gg — LoL 콤보 공유 플랫폼",
  description: "리그 오브 레전드 챔피언 콤보를 녹화하고 공유하세요. 데스크톱 앱으로 오버레이 연습까지.",
  openGraph: {
    title: "combo.gg — LoL 콤보 공유 플랫폼",
    description: "리그 오브 레전드 챔피언 콤보를 녹화하고 공유하세요.",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

const getHomeData = unstable_cache(async function getHomeData() {
  const [popularRaw, newestRaw, characters, diffGroups, easyTop, mediumTop, hardTop] = await Promise.all([
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
    prisma.combo.findMany({ where: { status: "published", difficulty: "easy" }, include: COMBO_INCLUDE, orderBy: { likeCount: "desc" }, take: 6 }),
    prisma.combo.findMany({ where: { status: "published", difficulty: "medium" }, include: COMBO_INCLUDE, orderBy: { likeCount: "desc" }, take: 6 }),
    prisma.combo.findMany({ where: { status: "published", difficulty: "hard" }, include: COMBO_INCLUDE, orderBy: { likeCount: "desc" }, take: 6 }),
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
    difficultyGroups: {
      easy: easyTop.map(toComboListItem),
      medium: mediumTop.map(toComboListItem),
      hard: hardTop.map(toComboListItem),
    } as Record<Difficulty, ReturnType<typeof toComboListItem>[]>,
  };
}, ["home-data"], { revalidate: 60 });

export default async function Home() {
  const { popularCombos, newestCombos, characters, difficultyCounts, featuredCombo, difficultyGroups } = await getHomeData();
  const t = getT("ko");

  return (
    <main className="flex-1">
      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="border-b border-border">
        <div className="max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-8 sm:py-12 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
          {/* Left */}
          <div>
            <h1 className="text-3xl lg:text-5xl font-black tracking-tight leading-tight mb-4">
              {t.hero_title1}<br />
              <span className="text-gold">{t.hero_title2}</span>
            </h1>
            <p className="text-text-secondary text-base lg:text-lg mb-8 max-w-lg">
              {t.hero_subtitle}
            </p>
            <div className="flex gap-3">
              <Link href="/upload" className="inline-flex items-center gap-2 h-11 px-6 rounded-[8px] bg-gold text-white font-bold text-sm hover:bg-gold-light transition-colors">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 11V3m0 0L4 6m3-3 3 3M2 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t.hero_share}
              </Link>
              <Link href="/download" className="inline-flex items-center gap-2 h-11 px-6 rounded-[8px] border border-border text-text-secondary font-bold text-sm hover:bg-surface-overlay hover:text-text transition-colors">
                {t.hero_download}
              </Link>
            </div>
          </div>

          {/* Right — featured combo card (hidden on mobile) */}
          {featuredCombo && (
            <Link
              href={`/combos/${featuredCombo.id}`}
              className="hidden lg:block group relative rounded-xl overflow-hidden border border-border bg-surface-raised hover:-translate-y-0.5 transition-transform"
            >
              <div className="absolute top-3 left-3 z-10 px-2 py-0.5 rounded bg-gold/90 text-white text-[10px] font-semibold">
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
                  <div className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center group-hover:bg-white/95 transition-colors">
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
        difficultyGroups={difficultyGroups}
      />
    </main>
  );
}
