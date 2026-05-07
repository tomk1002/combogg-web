import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  title: "관리자 — combo.gg",
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/combos", label: "콤보" },
  { href: "/admin/comments", label: "댓글" },
  { href: "/admin/users", label: "사용자" },
  { href: "/admin/reports", label: "신고" },
  { href: "/admin/banner", label: "배너" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-8 w-full flex-1 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
      <aside className="md:sticky md:top-24 self-start">
        <h2 className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3 px-3">
          Admin
        </h2>
        <nav className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-2 rounded-md text-sm font-semibold text-text-secondary hover:text-text hover:bg-surface-overlay transition-colors whitespace-nowrap"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
