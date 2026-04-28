export default function DownloadPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-8 py-20">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 rounded-2xl bg-surface-raised border border-border flex items-center justify-center mx-auto mb-6 text-3xl font-black font-mono">
          ⌥▷
        </div>
        <h1 className="text-3xl font-black tracking-tight mb-3">combo.gg 오버레이</h1>
        <p className="text-text-secondary mb-8">
          인게임에서 콤보를 연습하세요. Windows 전용 오버레이 앱으로
          콤보를 녹화하고 웹에 업로드할 수 있습니다.
        </p>
        <button className="w-full h-12 rounded-xl bg-gold text-white font-bold text-sm shadow-[0_2px_8px_rgba(184,134,11,0.32)] hover:bg-gold-light transition-colors cursor-pointer mb-3">
          Windows 다운로드 (준비 중)
        </button>
        <p className="text-xs text-text-muted">Windows 10 / 11 · Overwolf 필요</p>
      </div>
    </main>
  );
}
