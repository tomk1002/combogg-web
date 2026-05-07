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

  // 작성자는 status 무관하게 편집 가능 (draft / published / featured)
  // — removed 만 제외
  const combo = await prisma.combo.findUnique({
    where: { id },
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
      videoCrop: true,
      durationMs: true,
      authorId: true,
      status: true,
      game: { select: { slug: true } },
      character: { select: { slug: true, name: true } },
    },
  });

  if (!combo || combo.status === "removed") {
    redirect(`/combos/${id}`);
  }
  if (combo.authorId !== session.user.id) {
    redirect(`/combos/${id}`);
  }

  const patch = await getLatestPatch();
  const items = combo.game.slug === "lol" ? await getAllItems(patch) : [];

  // 상태 배지 정보
  const statusBadge =
    combo.status === "draft"
      ? { label: "DRAFT", cls: "bg-text-muted/20 text-text-secondary border-text-muted/30" }
      : combo.status === "featured"
      ? { label: "FEATURED", cls: "bg-gold/20 text-gold border-gold/30" }
      : { label: "PUBLIC", cls: "bg-easy/20 text-easy border-easy/30" };

  return (
    <main className="flex-1 max-w-[var(--width-content)] mx-auto px-8 py-10 w-full">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <h1 className="text-2xl font-black tracking-tight">콤보 편집</h1>
          <span className={`px-2 py-0.5 rounded-md border text-xs font-bold tracking-wide ${statusBadge.cls}`}>
            {statusBadge.label}
          </span>
        </div>
        <ComboEditForm combo={combo} items={items} patch={patch} />
      </div>
    </main>
  );
}
