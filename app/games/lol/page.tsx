import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";

export const revalidate = 60;
import ComboCard from "@/components/combo/combo-card";
import LolFilters from "@/components/games/lol/lol-filters";
import { prisma } from "@/lib/db";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";
import { getServerT } from "@/lib/i18n-server";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "League of Legends 콤보 | combo.gg",
  description: "리그 오브 레전드 챔피언별 콤보 모음. 쉬움부터 고급까지.",
  openGraph: {
    title: "LoL 콤보 | combo.gg",
    description: "챔피언별 콤보를 찾아보세요.",
    type: "website",
  },
};

interface Props {
  searchParams: Promise<{
    difficulty?: string;
    sort?: string;
    page?: string;
    character?: string;
    q?: string;
  }>;
}

export default async function LolPage({ searchParams }: Props) {
  const sp        = await searchParams;
  const difficulty = sp.difficulty as "easy" | "medium" | "hard" | undefined;
  const sort       = sp.sort ?? "latest";
  const page       = Math.max(1, Number(sp.page ?? "1"));
  const character  = sp.character;
  const q          = sp.q?.trim();
  const limit      = 18;

  const game = await prisma.game.findUnique({ where: { slug: "lol" } });

  const where: Prisma.ComboWhereInput = {
    status: "published",
    gameId: game?.id,
    ...(difficulty && { difficulty }),
    ...(character  && { character: { slug: character } }),
    ...(q          && { title: { contains: q, mode: "insensitive" } }),
  };

  const orderBy: Prisma.ComboOrderByWithRelationInput =
    sort === "popular"   ? { likeCount: "desc" } :
    sort === "downloads" ? { downloadCount: "desc" } :
                           { createdAt: "desc" };

  const t = await getServerT();

  const [combos, total, characters] = await Promise.all([
    prisma.combo.findMany({ where, include: COMBO_INCLUDE, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.combo.count({ where }),
    prisma.character.findMany({
      where: { gameId: game?.id },
      select: { slug: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const items      = combos.map(toComboListItem);
  const totalPages = Math.ceil(total / limit);

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const merged = {
      ...(difficulty && { difficulty }),
      ...(sort !== "latest" && { sort }),
      ...(page > 1 && { page: String(page) }),
      ...(character && { character }),
      ...(q && { q }),
      ...overrides,
    };
    const params = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => { if (v) params.set(k, v); });
    const str = params.toString();
    return `/games/lol${str ? `?${str}` : ""}`;
  };

  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
      if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("…");
      acc.push(p);
      return acc;
    }, []);

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-6 sm:py-10 w-full">

      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
        <div>
          <h1 className="text-2xl font-black tracking-tight">League of Legends</h1>
          <p className="text-text-secondary text-sm mt-1">
            {t.lol_combo_count(total)}
            {game?.currentPatch ? ` · ${t.lol_patch_label(game.currentPatch)}` : ""}
            {q ? ` · ${t.lol_search_result_label(q)}` : ""}
          </p>
        </div>
        <Link
          href="/download"
          className="ml-auto h-9 px-4 rounded-lg bg-gold text-white text-sm font-bold hover:bg-gold-light hover:shadow-[0_0_16px_rgba(200,155,60,0.50)] transition-all flex items-center"
        >
          {t.nav_upload}
        </Link>
      </div>

      {/* 필터 */}
      <div className="mb-6">
        <Suspense>
          <LolFilters characters={characters} />
        </Suspense>
      </div>

      {/* 그리드 */}
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((combo) => (
            <ComboCard key={combo.id} combo={combo} priority={items.indexOf(combo) < 3} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-text-secondary">
          <p className="text-lg font-semibold mb-2">
            {q ? t.lol_no_results_query(q) : t.empty_combos}
          </p>
          {q ? (
            <Link href="/games/lol" className="text-sm text-gold hover:underline">{t.view_all}</Link>
          ) : (
            <Link href="/download" className="text-sm text-gold hover:underline">{t.upload_first}</Link>
          )}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          {page > 1 ? (
            <Link href={buildHref({ page: String(page - 1) })} className="h-9 px-4 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:bg-surface-overlay hover:text-text transition-colors">
              {t.page_prev}
            </Link>
          ) : (
            <span className="h-9 px-4 rounded-lg border border-border text-sm font-semibold text-text-muted opacity-40 flex items-center">{t.page_prev}</span>
          )}

          <div className="flex gap-1">
            {pageNumbers.map((p, i) =>
              p === "…" ? (
                <span key={`ellipsis-${i}`} className="h-9 w-9 flex items-center justify-center text-sm text-text-muted">…</span>
              ) : (
                <Link
                  key={p}
                  href={buildHref({ page: p === 1 ? undefined : String(p) })}
                  className={`h-9 w-9 rounded-lg text-sm font-semibold flex items-center justify-center transition-colors ${
                    p === page
                      ? "bg-surface-overlay border border-[rgba(255,255,255,0.16)] text-text"
                      : "text-text-secondary hover:bg-surface-overlay hover:text-text"
                  }`}
                >
                  {p}
                </Link>
              )
            )}
          </div>

          {page < totalPages ? (
            <Link href={buildHref({ page: String(page + 1) })} className="h-9 px-4 rounded-lg border border-border text-sm font-semibold text-text-secondary hover:bg-surface-overlay hover:text-text transition-colors">
              {t.page_next}
            </Link>
          ) : (
            <span className="h-9 px-4 rounded-lg border border-border text-sm font-semibold text-text-muted opacity-40 flex items-center">{t.page_next}</span>
          )}
        </div>
      )}

    </main>
  );
}
