import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";
import ComboCard from "@/components/combo/combo-card";
import { getServerT } from "@/lib/i18n-server";

export const metadata: Metadata = {
  title: "내 라이브러리 | combo.gg",
  description: "저장한 콤보 목록",
};

// 사용자별 데이터 — 캐시 금지
export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/library");
  }

  const t = await getServerT();
  const userId = session.user.id;

  const saved = await prisma.savedCombo.findMany({
    where: {
      userId,
      combo: { status: { in: ["published", "featured"] } },
    },
    include: { combo: { include: COMBO_INCLUDE } },
    orderBy: { savedAt: "desc" },
  });

  const items = saved.map((s) => toComboListItem(s.combo));

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-10 w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 pb-6 border-b border-border">
        <span className="w-10 h-10 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center text-gold">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </span>
        <div>
          <h1 className="text-2xl font-black tracking-tight">{t.library_title}</h1>
          <p className="text-sm text-text-secondary">{t.library_count(items.length)}</p>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((combo) => (
            <ComboCard key={combo.id} combo={combo} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center py-20 gap-3">
          <span className="w-16 h-16 rounded-full bg-surface-overlay border border-border flex items-center justify-center text-text-muted">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          </span>
          <p className="text-base font-bold">{t.library_empty_title}</p>
          <p className="text-sm text-text-secondary max-w-md">{t.library_empty_desc}</p>
          <Link
            href="/games/lol"
            className="mt-2 inline-flex items-center h-9 px-4 rounded-[7px] bg-gold text-white text-sm font-bold hover:bg-gold-light transition-colors"
          >
            {t.library_browse}
          </Link>
        </div>
      )}
    </main>
  );
}
