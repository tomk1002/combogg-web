import Link from "next/link";

interface Props {
  searchParams: Promise<{ error?: string }>;
}

const ERROR_MESSAGES: Record<string, string> = {
  Configuration: "서버 설정 오류입니다. 관리자에게 문의하세요.",
  AccessDenied: "로그인이 거부되었습니다.",
  Verification: "링크가 만료되었거나 이미 사용되었습니다.",
  OAuthSignin: "OAuth 로그인 시작 중 오류가 발생했습니다.",
  OAuthCallback: "OAuth 콜백 처리 중 오류가 발생했습니다.",
  OAuthCreateAccount: "계정 생성 중 오류가 발생했습니다.",
  OAuthAccountNotLinked: "이미 다른 방법으로 가입된 이메일입니다.",
  Callback: "콜백 처리 중 오류가 발생했습니다.",
  Default: "로그인 중 알 수 없는 오류가 발생했습니다.",
};

export default async function AuthErrorPage({ searchParams }: Props) {
  const { error } = await searchParams;
  const message = error ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default) : ERROR_MESSAGES.Default;

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm text-center">
        <div className="text-4xl mb-4">⚠️</div>
        <h1 className="text-xl font-extrabold tracking-tight mb-2">로그인 실패</h1>
        <p className="text-sm text-text-secondary mb-2">{message}</p>
        {error && (
          <p className="text-xs text-text-muted mb-6 font-mono bg-surface-raised px-3 py-1.5 rounded-md inline-block">
            {error}
          </p>
        )}
        <div className="flex flex-col gap-2">
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-10 px-6 rounded-[7px] bg-gold text-white text-sm font-bold hover:bg-gold-light transition-colors"
          >
            다시 시도
          </Link>
          <Link href="/" className="text-sm text-text-muted hover:text-text transition-colors">
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}
