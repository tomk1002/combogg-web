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
          href="/upload"
          className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[7px] bg-gold text-white text-sm font-bold shadow-[0_1px_2px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.10)] hover:bg-gold-light transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 14V2m0 0L4 6m4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {t.nav_upload}
        </Link>
      )}
      <UserDropdown />
    </>
  );
}
