import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  pages: {
    error: "/error",
  },
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
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
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

      // timestamp base36 suffix — 사실상 충돌 불가, DB 왕복 없음
      const nickname = `${base}_${Date.now().toString(36)}`.slice(0, 28);

      await prisma.user.update({
        where: { id: user.id },
        data: { nickname, avatarUrl: user.image ?? null },
      });
    },
  },
});
