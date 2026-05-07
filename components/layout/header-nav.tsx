"use client";

import { useSession } from "next-auth/react";
import HeaderNotifications from "./header-notifications";
import UserDropdown from "./user-dropdown";

export default function HeaderNav() {
  const { data: session, status } = useSession();

  return (
    <>
      {status !== "loading" && session?.user && <HeaderNotifications />}
      <UserDropdown />
    </>
  );
}
