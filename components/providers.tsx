"use client";

import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { LangProvider } from "@/lib/i18n-client";

interface Props {
  children: React.ReactNode;
  session: Session | null;
}

export default function Providers({ children, session }: Props) {
  return (
    <SessionProvider session={session} refetchInterval={5 * 60} refetchOnWindowFocus={true}>
      <LangProvider>{children}</LangProvider>
    </SessionProvider>
  );
}
