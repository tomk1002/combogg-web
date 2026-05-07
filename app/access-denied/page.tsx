import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";

export const metadata: Metadata = {
  title: "비공개 알파 — combo.gg",
  description: "combo.gg는 현재 비공개 알파 테스트 중입니다.",
  robots: { index: false, follow: false },
};

// Replace with the real Google Form URL when ready.
const ALPHA_APPLY_URL =
  process.env.NEXT_PUBLIC_ALPHA_APPLY_URL ?? "https://forms.gle/your-alpha-form-id";
const CONTACT_EMAIL = "combo.gg@gmail.com";

export default async function AccessDeniedPage() {
  const cookieStore = await cookies();
  const locale = cookieStore.get("NEXT_LOCALE")?.value === "en" ? "en" : "ko";

  const copy =
    locale === "en"
      ? {
          kicker: "CLOSED ALPHA",
          title: "Closed alpha test in progress",
          desc:
            "combo.gg is currently in closed alpha testing. Only invited emails can sign in. If you'd like to join, apply below — we'll review and respond by email.",
          apply: "Apply for alpha access",
          back: "← Back to home",
          contactLine: "Already applied but can't access?",
          contactLink: "Email us",
        }
      : {
          kicker: "비공개 알파",
          title: "비공개 알파 테스트 중입니다",
          desc:
            "현재 combo.gg는 비공개 알파 테스트 중입니다. 초대된 이메일만 로그인할 수 있습니다. 알파 참여를 원하시면 아래에서 신청해주세요. 검토 후 이메일로 회신드립니다.",
          apply: "알파 참가 신청",
          back: "← 홈으로",
          contactLine: "이미 신청했는데 접근이 안 되시나요?",
          contactLink: "이메일 문의",
        };

  return (
    <main className="flex-1 min-h-[calc(100vh-200px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <p className="text-xs font-mono font-bold tracking-widest text-gold mb-3">
          {copy.kicker}
        </p>
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-surface-raised border border-border flex items-center justify-center text-2xl font-black font-mono select-none">
          ⌥▷
        </div>
        <h1 className="text-2xl font-black tracking-tight mb-3">{copy.title}</h1>
        <p className="text-sm text-text-secondary leading-relaxed mb-8">
          {copy.desc}
        </p>

        <div className="flex flex-col gap-3">
          <a
            href={ALPHA_APPLY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-11 px-6 rounded-[8px] bg-gold text-white text-sm font-bold hover:bg-gold-light transition-colors"
          >
            {copy.apply}
          </a>
          <Link
            href="/"
            className="inline-flex items-center justify-center h-10 text-sm text-text-muted hover:text-text transition-colors"
          >
            {copy.back}
          </Link>
        </div>

        <p className="mt-8 text-xs text-text-muted">
          {copy.contactLine}{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-gold hover:underline"
          >
            {copy.contactLink}
          </a>
        </p>
      </div>
    </main>
  );
}
