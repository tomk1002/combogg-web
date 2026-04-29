import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, notFound, serverError } from "@/lib/api/response";
import { getSupabaseAdmin, BUCKETS } from "@/lib/supabase";

interface Ctx { params: Promise<{ id: string }> }

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const session = await getSession();

    const combo = await prisma.combo.findUnique({ where: { id, status: "published" } });
    if (!combo) return notFound();
    if (!combo.tutfileUrl) return notFound("파일을 찾을 수 없습니다");

    // Download 기록 + 카운트 증가 (트랜잭션)
    await prisma.$transaction([
      prisma.download.create({ data: { userId: session?.user?.id ?? null, comboId: id } }),
      prisma.combo.update({ where: { id }, data: { downloadCount: { increment: 1 } } }),
    ]);

    // Signed URL 발급 (60분)
    const supabaseAdmin = getSupabaseAdmin();
    const path = combo.tutfileUrl.split(`${BUCKETS.tutfiles}/`)[1];
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKETS.tutfiles)
      .createSignedUrl(path, 3600);

    if (error || !data) return serverError(error);

    return ok({ url: data.signedUrl });
  } catch (err) {
    return serverError(err);
  }
}
