import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import UploadWizard from "@/components/upload/upload-wizard";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const game = await prisma.game.findUnique({ where: { slug: "lol" } });
  const characters = game
    ? await prisma.character.findMany({
        where: { gameId: game.id },
        select: { id: true, slug: true, name: true, iconUrl: true },
        orderBy: { name: "asc" },
      })
    : [];

  return (
    <main className="flex-1 max-w-2xl mx-auto px-8 py-10 w-full">
      <UploadWizard characters={characters} />
    </main>
  );
}
