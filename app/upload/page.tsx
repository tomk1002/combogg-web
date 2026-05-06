import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLatestPatch, getAllItems } from "@/lib/games/lol/ddragon";
import UploadWizard from "@/components/upload/upload-wizard";

export default async function UploadPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/upload");

  const game = await prisma.game.findUnique({ where: { slug: "lol" } });
  const [characters, patch] = await Promise.all([
    game
      ? prisma.character.findMany({
          where: { gameId: game.id },
          select: { id: true, slug: true, name: true, iconUrl: true },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    getLatestPatch(),
  ]);

  const items = await getAllItems(patch);

  return (
    <main className="flex-1 max-w-2xl mx-auto px-4 sm:px-8 py-10 w-full">
      <UploadWizard characters={characters} patch={patch} items={items} />
    </main>
  );
}
