import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ComboCard from "@/components/combo/combo-card";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const revalidate = 30;
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";

interface MasteryEntry {
  championId: number;
  championName: string;
  championIconUrl: string | null;
  points: number;
  level: number;
}

const TIER_STYLE: Record<string, { label: string; color: string }> = {
  IRON:        { label: "아이언",      color: "#8d8d8d" },
  BRONZE:      { label: "브론즈",      color: "#a0522d" },
  SILVER:      { label: "실버",        color: "#9e9e9e" },
  GOLD:        { label: "골드",        color: "#c9a227" },
  PLATINUM:    { label: "플래티넘",    color: "#00b4b4" },
  EMERALD:     { label: "에메랄드",    color: "#00a86b" },
  DIAMOND:     { label: "다이아",      color: "#5b9bd5" },
  MASTER:      { label: "마스터",      color: "#9b59b6" },
  GRANDMASTER: { label: "그랜드마스터", color: "#e74c3c" },
  CHALLENGER:  { label: "챌린저",      color: "#f0c040" },
};

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function UserProfilePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab } = await searchParams;

  const isLikesTab = tab === "likes";
  const isSavedTab = tab === "saved";

  const session = await auth();
  const isOwnProfile = session?.user?.id === id;

  const [user, combos, likedCombos, savedCombos] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nickname: true,
        avatarUrl: true,
        riotGameName: true,
        riotTagLine: true,
        riotSummonerIconId: true,
        riotTier: true,
        riotRank: true,
        riotLP: true,
        riotTopMasteries: true,
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
    isSavedTab && isOwnProfile
      ? prisma.savedCombo.findMany({
          where: { userId: id },
          include: { combo: { include: COMBO_INCLUDE } },
          orderBy: { savedAt: "desc" },
          take: 18,
        })
      : Promise.resolve([]),
  ]);

  if (!user) notFound();

  const items = combos.map(toComboListItem);
  const likedItems = likedCombos
    .filter((l) => l.combo.status === "published")
    .map((l) => toComboListItem(l.combo));
  const savedItems = savedCombos
    .filter((s) => s.combo.status === "published")
    .map((s) => toComboListItem(s.combo));

  const displayItems = isSavedTab ? savedItems : isLikesTab ? likedItems : items;

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
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black tracking-tight">
            {user.nickname ?? "unknown"}
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-1">
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
            {user.riotTier && (() => {
              const style = TIER_STYLE[user.riotTier] ?? { label: user.riotTier, color: "#888" };
              return (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: style.color + "22", color: style.color, border: `1px solid ${style.color}55` }}
                >
                  {style.label}{user.riotRank ? ` ${user.riotRank}` : ""}
                  {user.riotLP !== null ? ` ${user.riotLP}LP` : ""}
                </span>
              );
            })()}
          </div>
          {Array.isArray(user.riotTopMasteries) && (user.riotTopMasteries as unknown as MasteryEntry[]).length > 0 && (
            <div className="flex items-center gap-2 mt-2">
              {(user.riotTopMasteries as unknown as MasteryEntry[]).map((m) => (
                <div key={m.championId} className="flex items-center gap-1 text-xs text-text-muted">
                  {m.championIconUrl && (
                    <Image
                      src={m.championIconUrl}
                      alt={m.championName}
                      width={20}
                      height={20}
                      className="rounded-full"
                      title={m.championName}
                    />
                  )}
                  <span className="hidden sm:inline">{m.championName}</span>
                  <span className="text-text-secondary">Lv.{m.level}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-border">
        <Link
          href={`/users/${id}`}
          className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
            !isLikesTab && !isSavedTab
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
        {isOwnProfile && (
          <Link
            href={`/users/${id}?tab=saved`}
            className={`px-4 py-3 text-sm font-bold border-b-2 transition-colors ${
              isSavedTab
                ? "border-gold text-text"
                : "border-transparent text-text-secondary hover:text-text"
            }`}
          >
            저장한 콤보
          </Link>
        )}
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
          {isSavedTab
            ? "저장한 콤보가 없습니다."
            : isLikesTab
            ? "아직 좋아요한 콤보가 없습니다."
            : "아직 게시한 콤보가 없습니다."}
        </p>
      )}
    </main>
  );
}
