"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function UserDropdown() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (status === "loading") {
    return <div className="w-24 h-9 rounded-full bg-surface-raised animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center h-9 px-3.5 rounded-[7px] border border-[rgba(255,255,255,0.08)] text-sm font-semibold text-text-secondary hover:text-text hover:bg-surface-overlay transition-colors"
      >
        로그인
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="inline-flex items-center gap-2 h-9 px-2 pr-2.5 rounded-full border border-[rgba(255,255,255,0.08)] hover:bg-surface-overlay transition-colors cursor-pointer"
      >
        {user.image ? (
          <Image src={user.image} alt={user.name ?? ""} width={26} height={26} className="rounded-full shrink-0" />
        ) : (
          <span className="w-[26px] h-[26px] rounded-full bg-gold flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </span>
        )}
        <span className="text-sm font-semibold max-w-[80px] truncate">{user.name}</span>
        <svg
          width="12" height="12" viewBox="0 0 16 16" fill="none"
          className={`shrink-0 transition-transform duration-150 text-text-muted ${open ? "rotate-180" : ""}`}
        >
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] w-56 bg-surface-raised border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {/* User header */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-bold truncate">{user.name}</p>
            {user.email && <p className="text-xs text-text-muted truncate mt-0.5">{user.email}</p>}
          </div>

          {/* Navigation items */}
          <div className="py-1">
            <Link
              href={`/users/${user.id}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-surface-overlay transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-text-secondary">
                <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              내 프로필
            </Link>
            <Link
              href="/upload"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-surface-overlay transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-text-secondary">
                <path d="M12 20V4m0 0L6 10m6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              콤보 업로드
            </Link>
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-text hover:bg-surface-overlay transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-text-secondary">
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" stroke="currentColor" strokeWidth="1.8" />
              </svg>
              계정 설정
            </Link>
          </div>

          <div className="border-t border-border py-1">
            <button
              type="button"
              onClick={() => { setOpen(false); signOut({ callbackUrl: "/" }); }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-hard hover:bg-surface-overlay transition-colors cursor-pointer"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <polyline points="16 17 21 12 16 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
