import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth/require-auth";
import { ok, unauthorized, serverError } from "@/lib/api/response";
import { COMBO_INCLUDE, toComboListItem } from "@/lib/combo-queries";
import { verifyDesktopToken } from "@/lib/desktop-token";
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";

async function resolveUserId(req: Request): Promise<string | null> {
  const auth = req.headers.get("Authorization");
  if (auth?.startsWith("Bearer ")) {
    return verifyDesktopToken(auth.slice(7));
  }
  const session = await getSession();
  return session?.user?.id ?? null;
}

// 현재 사용자가 저장한 콤보 목록 (페이지네이션)
export async function GET(req: Request) {
  try {
    const userId = await resolveUserId(req);
    if (!userId) return unauthorized();

    const { searchParams } = new URL(req.url);
    const game       = searchParams.get("game");
    const character  = searchParams.get("character");
    const difficulty = searchParams.get("difficulty") as "easy" | "medium" | "hard" | null;
    const tags       = searchParams.get("tags")?.split(",").filter(Boolean);
    const page       = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit      = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "18")));

    const where: Prisma.ComboWhereInput = {
      status: { in: ["published", "featured"] },
      savedBy: { some: { userId } },
      ...(game       && { game: { slug: game } }),
      ...(character  && { character: { slug: character } }),
      ...(difficulty && { difficulty }),
      ...(tags?.length && { tags: { hasSome: tags } }),
    };

    const [combos, total] = await Promise.all([
      prisma.combo.findMany({
        where,
        include: COMBO_INCLUDE,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.combo.count({ where }),
    ]);

    return ok({ items: combos.map(toComboListItem), total, page, limit });
  } catch (err) {
    return serverError(err);
  }
}

// Explicit OPTIONS handler for Overwolf preflight requests.
export function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
