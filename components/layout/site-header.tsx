import Link from "next/link";
import HeaderSearch from "./header-search";
import LangToggle from "./lang-toggle";
import HeaderNav from "./header-nav";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-border">
      <div className="max-w-[var(--width-content)] mx-auto px-4 sm:px-8 py-3.5 flex items-center gap-6">
        <Link href="/" className="inline-flex items-center gap-2 shrink-0">
          <span className="w-[34px] h-[34px] rounded-[8px] bg-surface-raised flex items-center justify-center text-[11px] font-black font-mono shadow-[0_2px_4px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.10)]">
            ⌥▷
          </span>
          <span className="hidden sm:inline text-[18px] font-extrabold tracking-tight">
            combo<span className="text-gold">.gg</span>
          </span>
        </Link>

        <div className="hidden md:flex flex-1">
          <HeaderSearch />
        </div>

        <nav className="hidden sm:flex items-center shrink-0">
          <Link
            href="/games/lol"
            className="px-3 py-2 rounded-md text-sm font-semibold text-text-secondary hover:text-text hover:bg-surface-overlay transition-colors"
          >
            League of Legends
          </Link>
        </nav>

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <LangToggle />
          <HeaderNav />
        </div>
      </div>
    </header>
  );
}
