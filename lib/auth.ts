import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import { prisma } from "@/lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    Discord({
      clientId: process.env.AUTH_DISCORD_ID!,
      clientSecret: process.env.AUTH_DISCORD_SECRET!,
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
      // 첫 로그인 시 nickname 자동 생성 (OAuth name 기반)
      if (!user.name) return;

      const base = user.name.replace(/\s+/g, "_").toLowerCase().slice(0, 20);
      let nickname = base;
      let suffix = 1;

      // unique 될 때까지 suffix 증가
      while (await prisma.user.findUnique({ where: { nickname } })) {
        nickname = `${base}_${suffix++}`;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { nickname },
      });
    },
  },
});
