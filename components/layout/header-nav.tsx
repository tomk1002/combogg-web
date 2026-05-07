"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import HeaderNotifications from "./header-notifications";
import UserDropdown from "./user-dropdown";

export default function HeaderNav() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <>
      {status !== "loading" && session?.user && <HeaderNotifications />}
      {isAdmin && (
        <Link
          href="/admin"
          className="hidden sm:inline-flex items-center h-9 px-3 rounded-[7px] border border-gold/40 text-sm font-semibold text-gold hover:bg-gold/10 transition-colors"
        >
          관리자
        </Link>
      )}
      <UserDropdown />
    </>
  );
}
