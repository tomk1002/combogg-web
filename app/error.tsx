"use client";

import Link from "next/link";

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: Props) {
  return (
    <main className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-surface-raised border border-border flex items-center justify-center mb-6">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-text-secondary" />
        </svg>
      </div>

      <h1 className="text-2xl font-black tracking-tight mb-3">
        문제가 발생했습니다
      </h1>
      <p className="text-text-secondary text-sm mb-8 max-w-sm">
        {error.message || "예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해주세요."}
      </p>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 h-11 px-6 rounded-[8px] bg-gold text-white font-bold text-sm shadow-[0_2px_8px_rgba(184,134,11,0.32)] hover:bg-gold-light transition-colors cursor-pointer"
        >
          다시 시도
        </button>
        <Link
          href="/"
          className="inline-flex items-center h-11 px-6 rounded-[8px] border border-border text-text-secondary font-bold text-sm hover:bg-surface-overlay hover:text-text transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}
