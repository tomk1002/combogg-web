import Link from "next/link";
import { prisma } from "@/lib/db";
import { timeAgo } from "@/lib/utils";
import UserRoleToggle from "./role-toggle";

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
        _count: { select: { combos: true } },
      },
    }),
  ]);

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

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-xs text-text-muted uppercase">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">닉네임</th>
              <th className="px-3 py-2 text-left font-semibold">이메일</th>
              <th className="px-3 py-2 text-right font-semibold">콤보</th>
              <th className="px-3 py-2 text-left font-semibold">가입일</th>
              <th className="px-3 py-2 text-left font-semibold">권한</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-surface-overlay">
                <td className="px-3 py-2">
                  <Link href={`/users/${u.id}`} className="font-semibold hover:underline">
                    {u.nickname ?? u.name ?? "(no name)"}
                  </Link>
                </td>
                <td className="px-3 py-2 text-text-muted truncate max-w-[260px]">{u.email ?? "—"}</td>
                <td className="px-3 py-2 text-right tabular-nums">{u._count.combos}</td>
                <td className="px-3 py-2 text-text-muted whitespace-nowrap">{timeAgo(u.createdAt)}</td>
                <td className="px-3 py-2">
                  <UserRoleToggle userId={u.id} initialRole={u.role} />
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-sm text-text-muted">없음</td>
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
