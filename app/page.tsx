import Link from "next/link";
import ComboCard from "@/components/combo/combo-card";
import { prisma } from "@/lib/db";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";

async function getPopularCombos() {
  const combos = await prisma.combo.findMany({
    where: { status: "published" },
    include: COMBO_INCLUDE,
    orderBy: { likeCount: "desc" },
    take: 6,
  });
  return combos.map(toComboListItem);
}

export default async function Home() {
  const combos = await getPopularCombos();

  return (
    <main className="flex-1">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 pointer-events-none"
          style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
        />
        <div
          aria-hidden
          className="absolute right-[-150px] top-[-200px] w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(184,134,11,0.15) 0%, transparent 60%)" }}
        />
        <div className="relative max-w-[var(--width-content)] mx-auto px-8 py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold-muted border border-gold/40 text-[11px] font-bold text-gold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
              League of Legends · 패치 16.8
            </div>
            <h1 className="text-4xl font-black tracking-tight leading-tight mb-4">
              콤보를 녹화하고,<br />
              <span className="text-gold">공유하고, 연습하세요</span>
            </h1>
            <p className="text-text-secondary text-lg mb-8">
              챔피언별 콤보를 업로드하고 커뮤니티와 공유하세요.
              오버레이 앱으로 인게임에서 바로 연습할 수 있습니다.
            </p>
            <div className="flex gap-3">
              <Link href="/games/lol" className="inline-flex items-center gap-2 h-11 px-6 rounded-[8px] bg-gold text-white font-bold text-sm shadow-[0_2px_8px_rgba(184,134,11,0.32)] hover:bg-gold-light transition-colors">
                콤보 탐색하기
              </Link>
              <Link href="/download" className="inline-flex items-center gap-2 h-11 px-6 rounded-[8px] border border-[rgba(255,255,255,0.12)] text-text-secondary font-bold text-sm hover:bg-surface-overlay hover:text-text transition-colors">
                앱 다운로드
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Combo grid */}
      <section className="max-w-[var(--width-content)] mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-extrabold tracking-tight">인기 콤보</h2>
          <Link href="/games/lol" className="text-sm text-text-secondary hover:text-gold transition-colors font-semibold">
            전체 보기 →
          </Link>
        </div>
        {combos.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {combos.map((combo) => (
              <ComboCard key={combo.id} combo={combo} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 text-text-secondary">
            <p className="text-lg font-semibold mb-2">아직 등록된 콤보가 없습니다</p>
            <Link href="/upload" className="text-sm text-gold hover:underline">첫 번째 콤보를 업로드해보세요 →</Link>
          </div>
        )}
      </section>
    </main>
  );
}
