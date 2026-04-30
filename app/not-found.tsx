import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center py-24 px-4 text-center">
      <p className="text-[120px] sm:text-[160px] font-black leading-none text-gold select-none">
        404
      </p>
      <h1 className="text-2xl font-black tracking-tight mt-2 mb-3">
        페이지를 찾을 수 없습니다
      </h1>
      <p className="text-text-secondary text-sm mb-8 max-w-sm">
        요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 h-11 px-6 rounded-[8px] bg-gold text-white font-bold text-sm shadow-[0_2px_8px_rgba(184,134,11,0.32)] hover:bg-gold-light transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </main>
  );
}
