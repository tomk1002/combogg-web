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
  const { popularCombos, newestCombos, characters, difficultyCounts, difficultyGroups } = await getHomeData();
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
              <span className="text-gradient-gold">{t.hero_title2}</span>
            </h1>
            <p className="text-text-secondary text-base lg:text-lg mb-8 max-w-lg">
              {t.hero_subtitle}
            </p>
            <div className="flex gap-3">
              <Link href="/download" className="inline-flex items-center gap-2 h-11 px-6 rounded-[8px] bg-gold text-white font-bold text-sm hover:bg-gold-light hover:shadow-[0_0_20px_rgba(200,155,60,0.50)] transition-all">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 11V3m0 0L4 6m3-3 3 3M2 12h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t.hero_share}
              </Link>
            </div>
          </div>

          {/* Right — overlay 활용 예시 영상 (hidden on mobile, autoplay loop) */}
          <div className="hidden lg:block relative aspect-video rounded-xl overflow-hidden border border-border bg-surface-overlay">
            <video
              src="/preview.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </div>
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
