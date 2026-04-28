import Link from "next/link";
import { signInWithGoogle, signInWithDiscord } from "@/lib/actions/auth";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <Link href="/" className="inline-flex items-center gap-2 mb-8">
          <span className="w-[38px] h-[38px] rounded-[9px] bg-surface-raised flex items-center justify-center text-xs font-black font-mono shadow-[0_2px_4px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.10)]">
            ⌥▷
          </span>
          <span className="text-xl font-extrabold tracking-tight">
            combo<span className="text-gold">.gg</span>
          </span>
        </Link>

        <div className="bg-surface-raised rounded-xl p-8 border border-[rgba(255,255,255,0.08)]">
          <h1 className="text-2xl font-extrabold tracking-tight mb-1.5">
            다시 만나서 반가워요
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            계정에 로그인하고 콤보를 공유하세요
          </p>

          <div className="flex flex-col gap-3">
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="w-full h-11 rounded-[7px] bg-white text-[#212121] border border-[#E0E0E0] flex items-center justify-center gap-2.5 text-sm font-bold cursor-pointer hover:bg-[#F5F5F5] transition-colors"
              >
                <GoogleIcon />
                Google로 계속
              </button>
            </form>

            <form action={signInWithDiscord}>
              <button
                type="submit"
                className="w-full h-11 rounded-[7px] bg-[#5865F2] text-white flex items-center justify-center gap-2.5 text-sm font-bold cursor-pointer hover:bg-[#4752c4] transition-colors"
              >
                <DiscordIcon />
                Discord로 계속
              </button>
            </form>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-text-muted leading-relaxed">
          계속하면{" "}
          <span className="text-text-secondary">이용약관</span>과{" "}
          <span className="text-text-secondary">개인정보 처리방침</span>에 동의하게 됩니다.
        </p>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.101 18.08.112 18.1.12 18.12a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
    </svg>
  );
}
