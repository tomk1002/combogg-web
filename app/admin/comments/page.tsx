import Link from "next/link";
import { prisma } from "@/lib/db";
import { authorDisplayName, timeAgo } from "@/lib/utils";
import CommentDeleteButton from "./delete-button";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;

interface SearchParams {
  page?: string;
}

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page) || 1);

  const [total, comments] = await Promise.all([
    prisma.comment.count(),
    prisma.comment.findMany({
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        content: true,
        createdAt: true,
        comboId: true,
        combo: { select: { title: true } },
        user: {
          select: {
            id: true,
            nickname: true,
            riotGameName: true,
            riotTagLine: true,
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">댓글 관리</h1>
        <p className="text-sm text-text-muted mt-1">총 {total.toLocaleString()}개</p>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-xs text-text-muted uppercase">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">콤보</th>
              <th className="px-3 py-2 text-left font-semibold">작성자</th>
              <th className="px-3 py-2 text-left font-semibold">내용</th>
              <th className="px-3 py-2 text-left font-semibold">생성</th>
              <th className="px-3 py-2 text-right font-semibold">액션</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {comments.map((c) => (
              <tr key={c.id} className="hover:bg-surface-overlay">
                <td className="px-3 py-2 max-w-[180px]">
                  <Link href={`/combos/${c.comboId}`} className="hover:underline truncate block">
                    {c.combo.title}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/users/${c.user.id}`} className="hover:underline">
                    {authorDisplayName(c.user)}
                  </Link>
                </td>
                <td className="px-3 py-2 max-w-[360px]">
                  <p className="truncate text-text-secondary" title={c.content}>{c.content}</p>
                </td>
                <td className="px-3 py-2 text-text-muted whitespace-nowrap">{timeAgo(c.createdAt)}</td>
                <td className="px-3 py-2 text-right">
                  <CommentDeleteButton commentId={c.id} />
                </td>
              </tr>
            ))}
            {comments.length === 0 && (
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
            <Link href={`/admin/comments?page=${page - 1}`} className="px-3 py-1.5 rounded-md border border-border hover:bg-surface-overlay">
              이전
            </Link>
          )}
          <span className="text-text-muted">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/admin/comments?page=${page + 1}`} className="px-3 py-1.5 rounded-md border border-border hover:bg-surface-overlay">
              다음
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
