export default function UploadPage() {
  return (
    <main className="flex-1 max-w-2xl mx-auto px-8 py-10 w-full">
      <h1 className="text-2xl font-black tracking-tight mb-2">콤보 업로드</h1>
      <p className="text-text-secondary text-sm mb-8">
        데스크톱 앱에서 녹화한 .tutfile을 업로드하세요.
      </p>
      <div className="bg-surface-raised rounded-xl border-2 border-dashed border-border p-16 flex flex-col items-center justify-center text-center">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-text-muted mb-4">
          <path d="M12 16V4m0 0L8 8m4-4 4 4M4 20h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <p className="font-bold mb-1">업로드 기능 준비 중</p>
        <p className="text-sm text-text-secondary">Phase 4에서 구현 예정입니다.</p>
      </div>
    </main>
  );
}
