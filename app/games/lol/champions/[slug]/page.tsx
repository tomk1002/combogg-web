import Image from "next/image";
import { notFound } from "next/navigation";
import ComboCard from "@/components/combo/combo-card";
import { prisma } from "@/lib/db";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";

interface Props { params: Promise<{ slug: string }> }

export default async function ChampionPage({ params }: Props) {
  const { slug } = await params;

  const game = await prisma.game.findUnique({ where: { slug: "lol" } });
  if (!game) notFound();

  const character = await prisma.character.findUnique({
    where: { gameId_slug: { gameId: game.id, slug } },
  });
  if (!character) notFound();

  const combos = await prisma.combo.findMany({
    where: { characterId: character.id, status: "published" },
    include: COMBO_INCLUDE,
    orderBy: { likeCount: "desc" },
  });

  const items = combos.map(toComboListItem);

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-8 py-10 w-full">
      <div className="flex items-center gap-4 mb-8 pb-8 border-b border-border">
        {character.iconUrl && (
          <Image src={character.iconUrl} alt={character.name} width={56} height={56} className="rounded-xl" />
        )}
        <div>
          <h1 className="text-2xl font-black tracking-tight">{character.name}</h1>
          <p className="text-text-secondary text-sm mt-0.5">{items.length}개 콤보</p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      ) : (
        <p className="text-center text-text-secondary py-20">아직 등록된 콤보가 없습니다.</p>
      )}
    </main>
  );
}
