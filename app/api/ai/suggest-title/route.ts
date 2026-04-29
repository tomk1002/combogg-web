import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth/require-auth";
import { badRequest, unauthorized, serverError } from "@/lib/api/response";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("요청 본문이 없습니다");

  const { character, difficulty, inputSummary, patch } = body as {
    character: string;
    difficulty: string;
    inputSummary: Array<{ category: string; ref?: string }>;
    patch?: string;
  };

  if (!character || !difficulty) return badRequest("챔피언과 난이도는 필수입니다");

  const inputDesc = inputSummary
    .slice(0, 20)
    .map((i) => i.ref ? `${i.category}(${i.ref})` : i.category)
    .join(" → ");

  const diffLabel: Record<string, string> = { easy: "쉬움", medium: "보통", hard: "어려움" };

  const prompt = `당신은 리그 오브 레전드 콤보 공유 플랫폼의 콤보 제목 작성 도우미입니다.

다음 정보를 바탕으로 콤보 제목 3가지를 제안해주세요:
- 챔피언: ${character}
- 난이도: ${diffLabel[difficulty] ?? difficulty}
- 입력 시퀀스: ${inputDesc || "(정보 없음)"}
${patch ? `- 패치: ${patch}` : ""}

요구사항:
- 한국어로 작성
- 각 제목은 10~30자
- 구체적이고 플레이어가 무슨 콤보인지 바로 알 수 있게
- 번호나 설명 없이 제목만 한 줄씩 출력 (3줄)`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text ?? "";
    const suggestions = raw.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 3);

    return NextResponse.json({ suggestions });
  } catch (err) {
    return serverError(err);
  }
}
