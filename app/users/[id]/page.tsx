import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ComboCard from "@/components/combo/combo-card";
import { prisma } from "@/lib/db";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab } = await searchParams;

  const isLikesTab = tab === "likes";

  const [user, combos, likedCombos] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        riotGameName: true,
        riotTagLine: true,
        riotSummonerIconId: true,
      },
    }),
    prisma.combo.findMany({
      where: { authorId: id, status: "published" },
      include: COMBO_INCLUDE,
      orderBy: { createdAt: "desc" },
    }),
    isLikesTab
      ? prisma.like.findMany({
          where: { userId: id },
          include: { combo: { include: COMBO_INCLUDE } },
          orderBy: { createdAt: "desc" },
          take: 18,
        })
      : Promise.resolve([]),
  ]);

  if (!user) notFound();

  const items = combos.map(toComboListItem);
  const likedItems = likedCombos
    .filter((l) => l.combo.status === "published")
    .map((l) => toComboListItem(l.combo));

  const displayItems = isLikesTab ? likedItems : items;

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-10 w-full">
      {/* Profile header */}
      <div className="flex items-center gap-4 mb-10 pb-8 border-b border-border">
        {user.avatarUrl ? (
          <Image
            src={user.avatarUrl}
            alt="avatar"
            width={64}
            height={64}
            className="rounded-full"
          />
        ) : (
          <span className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center text-2xl font-black text-gold">
            {(user.nickname ?? "?")[0]?.toUpperCase()}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-black tracking-tight">
            {user.nickname ?? "unknown"}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-text-secondary text-sm">{items.length}개 콤보 게시</p>
            {user.riotGameName && (
              <span className="flex items-center gap-1.5 text-xs text-text-muted">
                {user.riotSummonerIconId && (
                  <Image
                    src={`https://ddragon.leagueoflegends.com/cdn/15.1.1/img/profileicon/${user.riotSummonerIconId}.png`}
                    alt="소환사 아이콘"
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                )}
                <span className="font-mono">
                  {user.riotGameName}#{user.riotTagLine}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border">
        <Link
          href={`/users/${id}`}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            !isLikesTab
              ? "border-gold text-text"
              : "border-transparent text-text-secondary hover:text-text"
          }`}
        >
          게시한 콤보{" "}
          <span className="ml-1.5 text-xs text-text-muted">{items.length}</span>
        </Link>
        <Link
          href={`/users/${id}?tab=likes`}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            isLikesTab
              ? "border-gold text-text"
              : "border-transparent text-text-secondary hover:text-text"
          }`}
        >
          좋아요
        </Link>
      </div>

      {/* Combo grid */}
      {displayItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayItems.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      ) : (
        <p className="text-center text-text-secondary py-20">
          {isLikesTab
            ? "아직 좋아요한 콤보가 없습니다."
            : "아직 게시한 콤보가 없습니다."}
        </p>
      )}
    </main>
  );
}
