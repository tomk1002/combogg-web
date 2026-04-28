import { notFound } from "next/navigation";
import ComboCard from "@/components/combo/combo-card";
import { prisma } from "@/lib/db";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";

interface Props { params: Promise<{ id: string }> }

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params;

  const [user, combos] = await Promise.all([
    prisma.user.findUnique({ where: { id }, select: { id: true, nickname: true, avatarUrl: true } }),
    prisma.combo.findMany({
      where: { authorId: id, status: "published" },
      include: COMBO_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!user) notFound();

  const items = combos.map(toComboListItem);

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-8 py-10 w-full">
      <div className="flex items-center gap-4 mb-10 pb-8 border-b border-border">
        <span className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center text-2xl font-black text-gold">
          {user.nickname[0]?.toUpperCase()}
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{user.nickname}</h1>
          <p className="text-text-secondary text-sm mt-0.5">{items.length}개 콤보 게시</p>
        </div>
      </div>
      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      ) : (
        <p className="text-center text-text-secondary py-20">아직 게시한 콤보가 없습니다.</p>
      )}
    </main>
  );
}
