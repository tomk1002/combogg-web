import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import { prisma } from "@/lib/db";
import { authConfig } from "@/lib/auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      checks: [],
    }),
    Discord({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
      checks: [],
    }),
  ],
  callbacks: {
    /**
     * Closed alpha email allowlist gate.
     *
     * Reads `ALPHA_ALLOWED_EMAILS` (comma-separated) from env. When the list is
     * empty (e.g. local dev), all sign-ins are allowed. When set, only listed
     * emails (case-insensitive) may sign in; rejected sign-ins are redirected
     * to `/access-denied` (see `pages.error` in `auth.config.ts`).
     */
    signIn({ user }) {
      const allowlist =
        process.env.ALPHA_ALLOWED_EMAILS?.split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean) ?? [];
      if (allowlist.length === 0) return true;
      const email = user.email?.toLowerCase();
      if (!email) return false;
      return allowlist.includes(email);
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.onboardingCompleted =
          (user as { onboardingCompleted?: boolean }).onboardingCompleted ?? false;
      }
      // Refresh role from DB on each JWT pass — cheap (id index lookup) and
      // keeps role current after admin promotion without forcing relogin.
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true },
        });
        token.role = dbUser?.role ?? "USER";
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.onboardingCompleted = (token.onboardingCompleted as boolean) ?? false;
        session.user.role = (token.role as "USER" | "ADMIN") ?? "USER";
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      const base = (user.name ?? "user")
        .replace(/\s+/g, "_")
        .toLowerCase()
        .slice(0, 16) || "user";

      const nickname = `${base}_${Date.now().toString(36)}`.slice(0, 28);

      await prisma.user.update({
        where: { id: user.id },
        data: { nickname, avatarUrl: user.image ?? null },
      });
    },
  },
});
