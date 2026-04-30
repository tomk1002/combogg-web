import type { NextAuthConfig } from "next-auth";

// Edge-safe config — no Prisma imports.
// Used by middleware.ts; lib/auth.ts extends this with the PrismaAdapter.
export const authConfig = {
  pages: { error: "/error" },
  providers: [], // real providers added in lib/auth.ts
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const completed =
        (auth?.user as { onboardingCompleted?: boolean } | undefined)
          ?.onboardingCompleted ?? true;
      const isOnboarding = nextUrl.pathname === "/onboarding";

      if (isLoggedIn && !completed && !isOnboarding) {
        return Response.redirect(new URL("/onboarding", nextUrl));
      }
      if (isLoggedIn && completed && isOnboarding) {
        return Response.redirect(new URL("/", nextUrl));
      }
      return true;
    },
  },
} satisfies NextAuthConfig;
