import Link from "next/link";
import { prisma } from "@/lib/db";
import { authorDisplayName, timeAgo } from "@/lib/utils";
import ReportActionButtons from "./action-buttons";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 30;
const STATUS_OPTIONS = [
  { value: "pending", label: "대기" },
  { value: "resolved", label: "처리" },
  { value: "dismissed", label: "기각" },
];

interface SearchParams {
  status?: string;
  page?: string;
}

interface TargetMeta {
  label: string;
  href: string | null;
  preview: string | null;
}

async function loadTargets(reports: { targetType: string; targetId: string }[]) {
  const comboIds = new Set<string>();
  const commentIds = new Set<string>();
  for (const r of reports) {
    if (r.targetType === "combo") comboIds.add(r.targetId);
    else if (r.targetType === "comment") commentIds.add(r.targetId);
  }

  const [combos, comments] = await Promise.all([
    comboIds.size
      ? prisma.combo.findMany({
          where: { id: { in: [...comboIds] } },
          select: { id: true, title: true, status: true },
        })
      : [],
    commentIds.size
      ? prisma.comment.findMany({
          where: { id: { in: [...commentIds] } },
          select: { id: true, content: true, comboId: true, combo: { select: { title: true } } },
        })
      : [],
  ]);

  const comboMap = new Map(combos.map((c) => [c.id, c]));
  const commentMap = new Map(comments.map((c) => [c.id, c]));

  return (r: { targetType: string; targetId: string }): TargetMeta => {
    if (r.targetType === "combo") {
      const c = comboMap.get(r.targetId);
      return c
        ? { label: `콤보: ${c.title}`, href: `/combos/${c.id}`, preview: `상태: ${c.status}` }
        : { label: `콤보 (삭제됨): ${r.targetId.slice(0, 8)}`, href: null, preview: null };
    }
    if (r.targetType === "comment") {
      const c = commentMap.get(r.targetId);
      return c
        ? {
            label: `댓글 on "${c.combo.title}"`,
            href: `/combos/${c.comboId}`,
            preview: c.content.slice(0, 120),
          }
        : { label: `댓글 (삭제됨): ${r.targetId.slice(0, 8)}`, href: null, preview: null };
    }
    return { label: `${r.targetType}:${r.targetId.slice(0, 8)}`, href: null, preview: null };
  };
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const status = sp.status ?? "pending";
  const page = Math.max(1, Number(sp.page) || 1);

  const where = STATUS_OPTIONS.some((o) => o.value === status) ? { status } : { status: "pending" };

  const [total, reports] = await Promise.all([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        reporter: { select: { id: true, nickname: true, riotGameName: true, riotTagLine: true } },
        resolvedBy: { select: { id: true, nickname: true } },
      },
    }),
  ]);

  const resolveTarget = await loadTargets(reports);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-black">신고 큐</h1>
        <p className="text-sm text-text-muted mt-1">총 {total.toLocaleString()}건</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.value;
          return (
            <Link
              key={opt.value}
              href={`/admin/reports?status=${opt.value}`}
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

      <ul className="flex flex-col gap-3">
        {reports.map((r) => {
          const target = resolveTarget(r);
          return (
            <li key={r.id} className="rounded-xl border border-border bg-surface-raised p-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted">
                <span className="px-2 py-0.5 rounded bg-surface-overlay font-semibold uppercase">
                  {r.targetType}
                </span>
                <span>·</span>
                <span>신고자 <Link href={`/users/${r.reporter.id}`} className="hover:underline">{authorDisplayName(r.reporter)}</Link></span>
                <span>·</span>
                <span>{timeAgo(r.createdAt)}</span>
                <span>·</span>
                <span className="font-semibold uppercase">{r.status}</span>
                {r.resolvedBy && r.resolvedAt && (
                  <>
                    <span>·</span>
                    <span>처리: {r.resolvedBy.nickname ?? "—"} ({timeAgo(r.resolvedAt)})</span>
                  </>
                )}
              </div>

              <div className="mt-2 text-sm">
                <div className="font-semibold">
                  {target.href ? (
                    <Link href={target.href} className="hover:underline">{target.label}</Link>
                  ) : (
                    <span className="text-text-muted">{target.label}</span>
                  )}
                </div>
                {target.preview && (
                  <div className="text-xs text-text-secondary mt-0.5 truncate">{target.preview}</div>
                )}
              </div>

              {r.reason && (
                <div className="mt-3 text-sm text-text-secondary p-2 rounded-md bg-surface border border-border">
                  <div className="text-xs font-semibold text-text-muted mb-0.5">사유</div>
                  {r.reason}
                </div>
              )}

              {r.status === "pending" && (
                <div className="mt-3">
                  <ReportActionButtons reportId={r.id} />
                </div>
              )}
            </li>
          );
        })}
        {reports.length === 0 && (
          <li className="rounded-xl border border-border bg-surface-raised p-8 text-center text-sm text-text-muted">
            없음
          </li>
        )}
      </ul>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-sm">
          {page > 1 && (
            <Link
              href={`/admin/reports?status=${status}&page=${page - 1}`}
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
              href={`/admin/reports?status=${status}&page=${page + 1}`}
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
