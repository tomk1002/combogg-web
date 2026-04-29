"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useLang } from "@/lib/i18n-client";

export default function HeaderNav() {
  const { data: session, status } = useSession();
  const { t } = useLang();
  const user = session?.user;

  return (
    <>
      <Link
        href="/upload"
        className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-[7px] bg-gold text-white text-sm font-bold shadow-[0_1px_2px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.10)] hover:bg-gold-light transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
          <path d="M8 14V2m0 0L4 6m4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {t.nav_upload}
      </Link>

      {status === "loading" ? (
        <div className="w-[72px] h-9 rounded-[7px] bg-surface-raised animate-pulse" />
      ) : user ? (
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
          <Link
            href="/settings"
            className="h-9 w-9 rounded-[7px] border border-[rgba(255,255,255,0.08)] text-text-secondary hover:text-text hover:bg-surface-overlay transition-colors flex items-center justify-center"
            title="계정 설정"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" stroke="currentColor" strokeWidth="1.8"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.8"/>
            </svg>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="h-9 px-3 rounded-[7px] border border-[rgba(255,255,255,0.08)] text-sm font-semibold text-text-secondary hover:text-text hover:bg-surface-overlay transition-colors cursor-pointer"
          >
            {t.nav_logout}
          </button>
        </div>
      ) : (
        <Link
          href="/login"
          className="inline-flex items-center h-9 px-3.5 rounded-[7px] border border-[rgba(255,255,255,0.08)] text-sm font-semibold text-text-secondary hover:text-text hover:bg-surface-overlay transition-colors"
        >
          {t.nav_login}
        </Link>
      )}
    </>
  );
}
