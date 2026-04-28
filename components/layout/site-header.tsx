import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { handleSignOut } from "@/lib/actions/auth";
import HeaderSearch from "./header-search";

export default async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
      <div className="max-w-[var(--width-content)] mx-auto px-8 py-3.5 flex items-center gap-6">
        <Link href="/" className="inline-flex items-center gap-2 shrink-0">
          <span className="w-[34px] h-[34px] rounded-[8px] bg-surface-raised flex items-center justify-center text-[11px] font-black font-mono shadow-[0_2px_4px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.10)]">
            ⌥▷
          </span>
          <span className="text-[18px] font-extrabold tracking-tight">
            combo<span className="text-gold">.gg</span>
          </span>
        </Link>

        <HeaderSearch />

        <nav className="flex items-center shrink-0">
          <Link
            href="/games/lol"
            className="px-3 py-2 rounded-md text-sm font-semibold text-text-secondary hover:text-text hover:bg-surface-overlay transition-colors"
          >
            League of Legends
          </Link>
        </nav>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <Link
            href="/upload"
            className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[7px] bg-gold text-white text-sm font-bold shadow-[0_1px_2px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.10)] hover:bg-gold-light transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M8 14V2m0 0L4 6m4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            업로드
          </Link>

          {user ? (
            <div className="flex items-center gap-1.5">
              <Link
                href={`/users/${user.id}`}
                className="inline-flex items-center gap-2 h-9 px-2 pr-3 rounded-full border border-[rgba(255,255,255,0.08)] hover:bg-surface-overlay transition-colors"
              >
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? ""}
                    width={26}
                    height={26}
                    className="rounded-full"
                  />
                ) : (
                  <span className="w-[26px] h-[26px] rounded-full bg-gold flex items-center justify-center text-xs font-bold text-white shrink-0">
                    {user.name?.[0]?.toUpperCase() ?? "U"}
                  </span>
                )}
                <span className="text-sm font-semibold">{user.name}</span>
              </Link>
              <form action={handleSignOut}>
                <button
                  type="submit"
                  className="h-9 px-3 rounded-[7px] border border-[rgba(255,255,255,0.08)] text-sm font-semibold text-text-secondary hover:text-text hover:bg-surface-overlay transition-colors cursor-pointer"
                >
                  로그아웃
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center h-9 px-3.5 rounded-[7px] border border-[rgba(255,255,255,0.08)] text-sm font-semibold text-text-secondary hover:text-text hover:bg-surface-overlay transition-colors"
            >
              로그인
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
