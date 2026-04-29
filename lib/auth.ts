import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Discord from "next-auth/providers/discord";
import { prisma } from "@/lib/db";
import type { Adapter, AdapterUser } from "next-auth/adapters";

async function generateNickname(name: string | null | undefined): Promise<string> {
  const base = (name ?? "user")
    .replace(/\s+/g, "_")
    .toLowerCase()
    .slice(0, 20) || "user";

  let nickname = base;
  let suffix = 1;
  while (await prisma.user.findUnique({ where: { nickname } })) {
    nickname = `${base}_${suffix++}`;
  }
  return nickname;
}

function buildAdapter(): Adapter {
  const base = PrismaAdapter(prisma);
  return {
    ...base,
    async createUser(data: AdapterUser) {
      const nickname = await generateNickname(data.name);
      return base.createUser!({ ...data, nickname } as AdapterUser);
    },
  };
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: buildAdapter(),
  trustHost: true,
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
});
