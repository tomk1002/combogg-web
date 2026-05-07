import Link from "next/link";
import { prisma } from "@/lib/db";
import { authorDisplayName, timeAgo } from "@/lib/utils";
import type { ComboStatus } from "@prisma/client";
import ComboStatusSelect from "./status-select";

export const dynamic = "force-dynamic";

const STATUS_OPTIONS: Array<{ value: "all" | ComboStatus; label: string }> = [
  { value: "all", label: "전체" },
  { value: "draft", label: "임시" },
  { value: "published", label: "공개" },
  { value: "featured", label: "추천" },
  { value: "removed", label: "삭제됨" },
];

const PAGE_SIZE = 20;

interface SearchParams {
  status?: string;
  page?: string;
}

export default async function AdminCombosPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = (sp.status ?? "all") as "all" | ComboStatus;
  const page = Math.max(1, Number(sp.page) || 1);

  const where = status === "all" ? {} : { status };

  const [total, combos] = await Promise.all([
    prisma.combo.count({ where }),
    prisma.combo.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        title: true,
        status: true,
        likeCount: true,
        viewCount: true,
        createdAt: true,
        author: {
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
        <h1 className="text-2xl font-black">콤보 관리</h1>
        <p className="text-sm text-text-muted mt-1">총 {total.toLocaleString()}개</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((opt) => {
          const active = (sp.status ?? "all") === opt.value;
          const href = opt.value === "all" ? "/admin/combos" : `/admin/combos?status=${opt.value}`;
          return (
            <Link
              key={opt.value}
              href={href}
              className={
                "px-3 py-1.5 rounded-full text-xs font-semibold transition-colors " +
                (active
                  ? "bg-text text-surface"
                  : "bg-surface-raised border border-border text-text-secondary hover:text-text")
              }
            >
              {opt.label}
            </Link>
          );
        })}
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-raised text-xs text-text-muted uppercase">
            <tr>
              <th className="px-3 py-2 text-left font-semibold">ID</th>
              <th className="px-3 py-2 text-left font-semibold">제목</th>
              <th className="px-3 py-2 text-left font-semibold">작성자</th>
              <th className="px-3 py-2 text-left font-semibold">상태</th>
              <th className="px-3 py-2 text-right font-semibold">좋아요</th>
              <th className="px-3 py-2 text-right font-semibold">조회</th>
              <th className="px-3 py-2 text-left font-semibold">생성</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {combos.map((c) => (
              <tr key={c.id} className="hover:bg-surface-overlay">
                <td className="px-3 py-2 font-mono text-xs text-text-muted">{c.id.slice(0, 8)}</td>
                <td className="px-3 py-2">
                  <Link href={`/combos/${c.id}`} className="font-semibold hover:underline truncate block max-w-[280px]">
                    {c.title}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <Link href={`/users/${c.author.id}`} className="hover:underline">
                    {authorDisplayName(c.author)}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  <ComboStatusSelect comboId={c.id} initialStatus={c.status} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{c.likeCount.toLocaleString()}</td>
                <td className="px-3 py-2 text-right tabular-nums">{c.viewCount.toLocaleString()}</td>
                <td className="px-3 py-2 text-text-muted">{timeAgo(c.createdAt)}</td>
              </tr>
            ))}
            {combos.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-sm text-text-muted">없음</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link
              href={`/admin/combos?${new URLSearchParams({ ...(status !== "all" && { status }), page: String(page - 1) }).toString()}`}
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
              href={`/admin/combos?${new URLSearchParams({ ...(status !== "all" && { status }), page: String(page + 1) }).toString()}`}
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
