import ComboCard from "@/components/combo/combo-card";
import { prisma } from "@/lib/db";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";
import type { Prisma } from "@prisma/client";

interface Props {
  searchParams: Promise<{ difficulty?: string; sort?: string; page?: string }>;
}

export default async function LolPage({ searchParams }: Props) {
  const sp = await searchParams;
  const difficulty = sp.difficulty as "easy" | "medium" | "hard" | undefined;
  const sort = sp.sort ?? "latest";
  const page = Math.max(1, Number(sp.page ?? "1"));
  const limit = 18;

  const game = await prisma.game.findUnique({ where: { slug: "lol" } });

  const where: Prisma.ComboWhereInput = {
    status: "published",
    gameId: game?.id,
    ...(difficulty && { difficulty }),
  };

  const orderBy: Prisma.ComboOrderByWithRelationInput =
    sort === "popular"   ? { likeCount: "desc" } :
    sort === "downloads" ? { downloadCount: "desc" } :
                           { createdAt: "desc" };

  const [combos, total] = await Promise.all([
    prisma.combo.findMany({ where, include: COMBO_INCLUDE, orderBy, skip: (page - 1) * limit, take: limit }),
    prisma.combo.count({ where }),
  ]);

  const items = combos.map(toComboListItem);

  const DIFFICULTY_FILTERS = [
    { label: "전체", value: undefined },
    { label: "쉬움",   value: "easy" },
    { label: "보통",   value: "medium" },
    { label: "어려움", value: "hard" },
  ];

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-8 py-10 w-full">
      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
        <div>
          <h1 className="text-2xl font-black tracking-tight">League of Legends</h1>
          <p className="text-text-secondary text-sm mt-1">{total}개 콤보 · 패치 {game?.currentPatch ?? "-"}</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {DIFFICULTY_FILTERS.map(({ label, value }) => {
          const active = difficulty === value;
          return (
            <a
              key={label}
              href={value ? `/games/lol?difficulty=${value}` : "/games/lol"}
              className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors ${
                active
                  ? "bg-surface-overlay border-[rgba(255,255,255,0.16)] text-text"
                  : "border-border text-text-secondary hover:border-[rgba(255,255,255,0.24)] hover:text-text"
              }`}
            >
              {label}
            </a>
          );
        })}
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      ) : (
        <p className="text-center text-text-secondary py-24">아직 등록된 콤보가 없습니다.</p>
      )}
    </main>
  );
}
