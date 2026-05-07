import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatCount, timeAgo } from "@/lib/utils";
import { requireAdmin } from "@/lib/auth/require-admin";
import UserRoleToggle from "./role-toggle";
import UserDeleteButton from "./delete-button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

interface SearchParams {
  page?: string;
  q?: string;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { userId: currentUserId } = await requireAdmin();

  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);
  const q = (sp.q ?? "").trim();

  const where = q
    ? {
        OR: [
          { nickname: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
          { name: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        nickname: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }),
  ]);

  // 통계 집계 (배치). 페이지당 사용자만 대상이라 N+1 회피 가능.
  const userIds = users.map((u) => u.id);

  const [comboStats, savedStats, commentStats] = userIds.length
    ? await Promise.all([
        prisma.combo.groupBy({
          by: ["authorId"],
          where: { authorId: { in: userIds } },
          _count: { _all: true },
          _sum: { likeCount: true, viewCount: true },
        }),
        // saved_combos 는 combo 의 authorId 기준 집계가 필요 — combo 와 join.
        prisma.savedCombo.findMany({
          where: { combo: { authorId: { in: userIds } } },
          select: { combo: { select: { authorId: true } } },
        }),
        prisma.comment.groupBy({
          by: ["userId"],
          where: { userId: { in: userIds } },
          _count: { _all: true },
        }),
      ])
    : [[], [], []];

  const comboStatsMap = new Map<
    string,
    { combos: number; likes: number; views: number }
  >();
  for (const s of comboStats) {
    comboStatsMap.set(s.authorId, {
      combos: s._count._all,
      likes: s._sum.likeCount ?? 0,
      views: s._sum.viewCount ?? 0,
    });
  }

  const savedCountMap = new Map<string, number>();
  for (const row of savedStats) {
    const aid = row.combo.authorId;
    savedCountMap.set(aid, (savedCountMap.get(aid) ?? 0) + 1);
  }

  const commentCountMap = new Map<string, number>();
  for (const c of commentStats) {
    commentCountMap.set(c.userId, c._count._all);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">사용자 관리</h1>
        <p className="text-sm text-text-muted mt-1">총 {total.toLocaleString()}명</p>
      </div>

      <form action="/admin/users" className="flex gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="닉네임·이메일·이름 검색"
          className="flex-1 max-w-sm h-9 px-3 rounded-md border border-border bg-surface-raised text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)]"
        />
        <button
          type="submit"
          className="h-9 px-3 rounded-md border border-border bg-surface-raised text-sm font-semibold hover:bg-surface-overlay"
        >
          검색
        </button>
      </form>

      <div className="rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[1000px]">
          <thead className="bg-surface-raised text-xs text-text-muted uppercase">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">닉네임</th>
              <th className="px-3 py-2 text-left font-semibold">이메일</th>
              <th className="px-3 py-2 text-right font-semibold">콤보</th>
              <th className="px-3 py-2 text-right font-semibold">좋아요</th>
              <th className="px-3 py-2 text-right font-semibold">저장</th>
              <th className="px-3 py-2 text-right font-semibold">조회</th>
              <th className="px-3 py-2 text-right font-semibold">댓글</th>
              <th className="px-3 py-2 text-left font-semibold">가입일</th>
              <th className="px-3 py-2 text-left font-semibold">권한</th>
              <th className="px-3 py-2 text-left font-semibold">관리</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const cs = comboStatsMap.get(u.id);
              const combos = cs?.combos ?? 0;
              const likes = cs?.likes ?? 0;
              const views = cs?.views ?? 0;
              const saves = savedCountMap.get(u.id) ?? 0;
              const comments = commentCountMap.get(u.id) ?? 0;
              const displayName = u.nickname ?? u.name ?? "(no name)";
              const isSelf = u.id === currentUserId;
              return (
                <tr key={u.id} className="hover:bg-surface-overlay">
                  <td className="px-3 py-2">
                    <Link href={`/users/${u.id}`} className="font-semibold hover:underline">
                      {displayName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-text-muted truncate max-w-[260px]">{u.email ?? "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{combos}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{likes}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{saves}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCount(views)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{comments}</td>
                  <td className="px-3 py-2 text-text-muted whitespace-nowrap">{timeAgo(u.createdAt)}</td>
                  <td className="px-3 py-2">
                    <UserRoleToggle userId={u.id} initialRole={u.role} />
                  </td>
                  <td className="px-3 py-2">
                    {isSelf ? (
                      <span className="text-xs text-text-muted">본인</span>
                    ) : (
                      <UserDeleteButton userId={u.id} nickname={displayName} />
                    )}
                  </td>
                </tr>
              );
            })}
            {users.length === 0 && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-sm text-text-muted">없음</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link
              href={`/admin/users?${new URLSearchParams({ ...(q && { q }), page: String(page - 1) }).toString()}`}
              className="px-3 py-1.5 rounded-md border border-border hover:bg-surface-overlay"
            >
              이전
            </Link>
          )}
          <span className="text-text-muted">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/users?${new URLSearchParams({ ...(q && { q }), page: String(page + 1) }).toString()}`}
              className="px-3 py-1.5 rounded-md border border-border hover:bg-surface-overlay"
            >
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
