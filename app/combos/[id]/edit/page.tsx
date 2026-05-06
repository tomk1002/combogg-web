import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getLatestPatch, getAllItems } from "@/lib/games/lol/ddragon";
import ComboEditForm from "@/components/combo/combo-edit-form";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ComboEditPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/combos/${id}/edit`);
  }

  const combo = await prisma.combo.findUnique({
    where: { id, status: "published" },
    select: {
      id: true,
      title: true,
      description: true,
      tip: true,
      difficulty: true,
      tags: true,
      gameSpecific: true,
      inputSummary: true,
      steps: true,
      thumbnailUrl: true,
      videoUrl: true,
      durationMs: true,
      authorId: true,
      game: { select: { slug: true } },
      character: { select: { slug: true, name: true } },
    },
  });

  if (!combo || combo.authorId !== session.user.id) {
    redirect(`/combos/${id}`);
  }

  const patch = await getLatestPatch();
  const items = combo.game.slug === "lol" ? await getAllItems(patch) : [];

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-8 py-10 w-full">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-black tracking-tight mb-6">콤보 수정</h1>
        <ComboEditForm combo={combo} items={items} patch={patch} />
      </div>
    </main>
  );
}
