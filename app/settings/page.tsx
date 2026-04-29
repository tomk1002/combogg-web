import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import SettingsContent from "@/components/settings/settings-content";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      nickname: true,
      avatarUrl: true,
      email: true,
      riotGameName: true,
      riotTagLine: true,
      riotSummonerIconId: true,
    },
  });

  if (!user) redirect("/login");

  return (
    <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-8 py-10 w-full">
      <h1 className="text-2xl font-black tracking-tight mb-8">계정 설정</h1>
      <SettingsContent user={user} />
    </main>
  );
}
