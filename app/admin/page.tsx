import Link from "next/link";
import { prisma } from "@/lib/db";
import { authorDisplayName, timeAgo } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const [
    comboByStatus,
    totalUsers,
    totalComments,
    viewSum,
    saveCount,
    likeCount,
    recentCombos,
    recentUsers,
    recentComments,
  ] = await Promise.all([
    prisma.combo.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.user.count(),
    prisma.comment.count(),
    prisma.combo.aggregate({ _sum: { viewCount: true } }),
    prisma.savedCombo.count(),
    prisma.like.count(),
    prisma.combo.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        author: { select: { nickname: true, riotGameName: true, riotTagLine: true } },
      },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        nickname: true,
        email: true,
        createdAt: true,
        role: true,
      },
    }),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        content: true,
        createdAt: true,
        comboId: true,
        combo: { select: { title: true } },
        user: { select: { nickname: true, riotGameName: true, riotTagLine: true } },
      },
    }),
  ]);

  const statusMap = Object.fromEntries(
    comboByStatus.map((g) => [g.status, g._count._all])
  ) as Record<string, number>;
  const totalCombos =
    (statusMap.draft ?? 0) +
    (statusMap.published ?? 0) +
    (statusMap.featured ?? 0) +
    (statusMap.removed ?? 0);

  return {
    totalCombos,
    statusMap,
    totalUsers,
    totalComments,
    totalViews: viewSum._sum.viewCount ?? 0,
    totalSaves: saveCount,
    totalLikes: likeCount,
    recentCombos,
    recentUsers,
    recentComments,
  };
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <div className="text-xs text-text-muted font-semibold uppercase tracking-wide">{label}</div>
      <div className="mt-1 text-2xl font-black tabular-nums">{typeof value === "number" ? value.toLocaleString() : value}</div>
      {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const data = await getDashboardData();
  const s = data.statusMap;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-black">대시보드</h1>
        <p className="text-sm text-text-muted mt-1">사이트 전체 지표 요약</p>
      </div>

      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard
          label="콤보"
          value={data.totalCombos}
          sub={`published ${s.published ?? 0} · draft ${s.draft ?? 0} · featured ${s.featured ?? 0} · removed ${s.removed ?? 0}`}
        />
        <StatCard label="사용자" value={data.totalUsers} />
        <StatCard label="댓글" value={data.totalComments} />
        <StatCard label="조회수" value={data.totalViews} />
        <StatCard label="저장" value={data.totalSaves} />
        <StatCard label="좋아요" value={data.totalLikes} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-surface-raised">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold">최신 콤보</h2>
            <Link href="/admin/combos" className="text-xs text-text-muted hover:text-text">전체 →</Link>
          </div>
          <ul className="divide-y divide-border">
            {data.recentCombos.map((c) => (
              <li key={c.id} className="px-4 py-2.5 text-sm">
                <Link href={`/combos/${c.id}`} className="font-semibold hover:underline truncate block">{c.title}</Link>
                <div className="text-xs text-text-muted mt-0.5 flex gap-2">
                  <span>{authorDisplayName(c.author)}</span>
                  <span>·</span>
                  <span>{c.status}</span>
                  <span>·</span>
                  <span>{timeAgo(c.createdAt)}</span>
                </div>
              </li>
            ))}
            {data.recentCombos.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-text-muted">없음</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface-raised">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold">최신 사용자</h2>
            <Link href="/admin/users" className="text-xs text-text-muted hover:text-text">전체 →</Link>
          </div>
          <ul className="divide-y divide-border">
            {data.recentUsers.map((u) => (
              <li key={u.id} className="px-4 py-2.5 text-sm">
                <div className="font-semibold truncate flex items-center gap-2">
                  {u.nickname ?? "(no nickname)"}
                  {u.role === "ADMIN" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold font-bold">ADMIN</span>}
                </div>
                <div className="text-xs text-text-muted mt-0.5 truncate">
                  {u.email ?? "—"} · {timeAgo(u.createdAt)}
                </div>
              </li>
            ))}
            {data.recentUsers.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-text-muted">없음</li>
            )}
          </ul>
        </div>

        <div className="rounded-xl border border-border bg-surface-raised">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <h2 className="text-sm font-bold">최신 댓글</h2>
            <Link href="/admin/comments" className="text-xs text-text-muted hover:text-text">전체 →</Link>
          </div>
          <ul className="divide-y divide-border">
            {data.recentComments.map((c) => (
              <li key={c.id} className="px-4 py-2.5 text-sm">
                <div className="text-xs text-text-muted mb-0.5">
                  <Link href={`/combos/${c.comboId}`} className="hover:underline">
                    {c.combo.title}
                  </Link>
                  {" · "}
                  <span>{authorDisplayName(c.user)}</span>
                  {" · "}
                  <span>{timeAgo(c.createdAt)}</span>
                </div>
                <p className="text-text-secondary truncate">{c.content}</p>
              </li>
            ))}
            {data.recentComments.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-text-muted">없음</li>
            )}
          </ul>
        </div>
      </section>
    </div>
  );
}
