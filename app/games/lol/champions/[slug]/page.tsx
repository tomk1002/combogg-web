import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Prisma, Difficulty } from "@prisma/client";
import ComboCard from "@/components/combo/combo-card";
import { prisma } from "@/lib/db";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ difficulty?: string; sort?: string }>;
}

export default async function ChampionPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { difficulty, sort } = await searchParams;

  const game = await prisma.game.findUnique({ where: { slug: "lol" } });
  if (!game) notFound();

  const character = await prisma.character.findUnique({
    where: { gameId_slug: { gameId: game.id, slug } },
  });
  if (!character) notFound();

  const difficultyFilter: Difficulty | undefined =
    difficulty === "easy" || difficulty === "medium" || difficulty === "hard"
      ? difficulty
      : undefined;

  const where: Prisma.ComboWhereInput = {
    characterId: character.id,
    status: "published",
    ...(difficultyFilter !== undefined ? { difficulty: difficultyFilter } : {}),
  };

  const orderBy: Prisma.ComboOrderByWithRelationInput =
    sort === "latest"
      ? { createdAt: "desc" }
      : { likeCount: "desc" };

  const [combos, total] = await Promise.all([
    prisma.combo.findMany({ where, include: COMBO_INCLUDE, orderBy }),
    prisma.combo.count({ where }),
  ]);

  const items = combos.map(toComboListItem);

  const sortOptions = [
    { v: "popular", l: "인기순" },
    { v: "latest", l: "최신순" },
  ] as const;

  const difficultyOptions = [
    { v: "easy", l: "쉬움" },
    { v: "medium", l: "보통" },
    { v: "hard", l: "어려움" },
  ] as const;

  const activeSort = sort === "latest" ? "latest" : "popular";

  function buildHref(newDifficulty?: string, newSort?: string) {
    const params = new URLSearchParams();
    if (newDifficulty) params.set("difficulty", newDifficulty);
    if (newSort && newSort !== "popular") params.set("sort", newSort);
    const qs = params.toString();
    return `/games/lol/champions/${slug}${qs ? `?${qs}` : ""}`;
  }

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-8 py-10 w-full">
      {/* Champion header */}
      <div className="mb-8 pb-8 border-b border-border">
        <div className="flex items-center gap-4 mb-6">
          {character.iconUrl && (
            <Image
              src={character.iconUrl}
              alt={character.name}
              width={72}
              height={72}
              className="rounded-2xl border border-border"
            />
          )}
          <div>
            <p className="text-xs font-black tracking-widest text-text-muted mb-1">
              LEAGUE OF LEGENDS
            </p>
            <h1 className="text-3xl font-black tracking-tight">{character.name}</h1>
            <p className="text-text-secondary text-sm mt-1">{total}개 콤보</p>
          </div>
          <Link
            href="/games/lol"
            className="ml-auto text-sm text-text-secondary hover:text-text transition-colors"
          >
            ← LoL 전체 보기
          </Link>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sort */}
          <div className="flex gap-1 mr-2">
            {sortOptions.map(({ v, l }) => (
              <Link
                key={v}
                href={buildHref(difficultyFilter, v)}
                className={`px-3 h-8 rounded-lg text-xs font-bold border transition-colors flex items-center ${
                  activeSort === v
                    ? "bg-surface-overlay border-[rgba(255,255,255,0.24)] text-text"
                    : "border-border text-text-secondary hover:text-text"
                }`}
              >
                {l}
              </Link>
            ))}
          </div>

          {/* Difficulty */}
          {difficultyOptions.map(({ v, l }) => {
            const isActive = difficultyFilter === v;
            const href = isActive
              ? buildHref(undefined, activeSort)
              : buildHref(v, activeSort);
            return (
              <Link
                key={v}
                href={href}
                className={`px-3 h-8 rounded-lg text-xs font-bold border transition-colors flex items-center ${
                  isActive
                    ? "bg-surface-overlay border-[rgba(255,255,255,0.24)] text-text"
                    : "border-border text-text-secondary hover:text-text"
                }`}
              >
                {l}
              </Link>
            );
          })}
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      ) : (
        <p className="text-center text-text-secondary py-20">
          아직 등록된 콤보가 없습니다.
        </p>
      )}
    </main>
  );
}
