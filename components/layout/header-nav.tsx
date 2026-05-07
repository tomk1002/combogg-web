"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useLang } from "@/lib/i18n-client";
import UserDropdown from "./user-dropdown";

export default function HeaderNav() {
  const { data: session, status } = useSession();
  const { t } = useLang();

  return (
    <>
      {status !== "loading" && session?.user && (
        <Link
          href="/library"
          className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-[7px] text-sm font-semibold text-text-secondary hover:text-text hover:bg-surface-overlay transition-colors"
          title={t.nav_library}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          {t.nav_library}
        </Link>
      )}
      <UserDropdown />
    </>
  );
}
