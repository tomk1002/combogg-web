import Link from "next/link";

export default function DownloadPage() {
  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-8 py-16 w-full">
      {/* Hero */}
      <section className="text-center mb-16">
        <div className="w-20 h-20 rounded-2xl bg-surface-raised border border-border flex items-center justify-center mx-auto mb-6 text-3xl font-black font-mono select-none">
          ⌥▷
        </div>
        <h1 className="text-4xl font-black tracking-tight mb-3">combo.gg 오버레이</h1>
        <p className="text-text-secondary text-lg mb-8 max-w-md mx-auto">
          인게임 오버레이로 콤보를 실시간 연습하세요
        </p>
        <div className="inline-flex flex-col items-center gap-2 mb-3">
          <span className="inline-flex items-center gap-2.5 px-8 h-12 rounded-xl bg-gold text-white font-bold text-sm shadow-[0_4px_16px_var(--color-gold-muted)] cursor-default select-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 16V4m0 12L8 9m4 7 4-7M3 20h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Windows 다운로드
            <span className="text-[10px] font-semibold bg-white/20 px-1.5 py-0.5 rounded-full">출시 예정</span>
          </span>
        </div>
        <p className="text-xs text-text-muted">Windows 10 / 11 · Overwolf 필요</p>
      </section>

      {/* Feature cards */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-16">
        <div className="bg-surface-raised border border-border rounded-xl p-6">
          <div className="text-2xl mb-3">🎮</div>
          <h3 className="font-bold text-sm mb-2">녹화</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            게임 중 키 입력을 자동으로 캡처해 .tutfile로 저장
          </p>
        </div>
        <div className="bg-surface-raised border border-border rounded-xl p-6">
          <div className="text-2xl mb-3">▷</div>
          <h3 className="font-bold text-sm mb-2">오버레이 연습</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            게임 위에 입력 시퀀스를 오버레이로 표시. 따라하며 연습
          </p>
        </div>
        <div className="bg-surface-raised border border-border rounded-xl p-6">
          <div className="text-2xl mb-3">↑</div>
          <h3 className="font-bold text-sm mb-2">웹 공유</h3>
          <p className="text-sm text-text-secondary leading-relaxed">
            녹화한 콤보를 웹에 바로 업로드해 커뮤니티와 공유
          </p>
        </div>
      </section>

      {/* Install guide */}
      <section className="bg-surface-raised border border-border rounded-2xl p-8 mb-16">
        <h2 className="text-lg font-black tracking-tight mb-6">설치 가이드</h2>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex gap-4 flex-1">
            <div className="w-8 h-8 rounded-full bg-surface-overlay border border-border flex items-center justify-center text-xs font-black text-text-muted shrink-0 mt-0.5">
              1
            </div>
            <div>
              <p className="font-bold text-sm mb-1">Overwolf 설치</p>
              <p className="text-sm text-text-secondary mb-2">
                게임 오버레이 플랫폼 Overwolf를 먼저 설치합니다.
              </p>
              <a
                href="https://www.overwolf.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gold hover:underline"
              >
                overwolf.com →
              </a>
            </div>
          </div>
          <div className="hidden sm:block w-px bg-border" />
          <div className="flex gap-4 flex-1">
            <div className="w-8 h-8 rounded-full bg-surface-overlay border border-border flex items-center justify-center text-xs font-black text-text-muted shrink-0 mt-0.5">
              2
            </div>
            <div>
              <p className="font-bold text-sm mb-1">combo.gg 앱 설치</p>
              <p className="text-sm text-text-secondary mb-2">
                Overwolf 설치 후 combo.gg 앱을 설치합니다.
              </p>
              <span className="inline-flex items-center gap-1.5 text-sm text-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
                출시 예정
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="text-center">
        <p className="text-text-secondary text-sm mb-3">이미 콤보가 있나요?</p>
        <Link
          href="/upload"
          className="inline-flex items-center gap-1.5 px-6 h-10 rounded-xl bg-surface-raised border border-border text-sm font-bold hover:border-[rgba(255,255,255,0.24)] transition-colors"
        >
          콤보 업로드하기 →
        </Link>
      </section>
    </main>
  );
}
