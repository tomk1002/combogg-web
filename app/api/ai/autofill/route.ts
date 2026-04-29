import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth/require-auth";
import { badRequest, unauthorized, serverError } from "@/lib/api/response";
import { NextResponse } from "next/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface InputEntry {
  category: string;
  ref?: string;
  slot?: string | number;
  t?: number;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body) return badRequest("요청 본문이 없습니다");

  const { character, inputs, durationMs, patch } = body as {
    character: string;
    inputs: InputEntry[];
    durationMs?: number;
    patch?: string;
  };

  if (!character) return badRequest("챔피언은 필수입니다");

  // 입력 시퀀스 텍스트 표현 (최대 30개)
  const inputDesc = inputs
    .slice(0, 30)
    .map((i) => i.ref ? `${i.category}(${i.ref})` : i.category)
    .join(" → ");

  // 난이도 추론 힌트
  const inputCount = inputs.length;
  const hasCancelPattern = inputs.some((i) => i.category === "attack_cancel");
  const hasFlash = inputs.some((i) => i.ref === "SummonerFlash");
  const hasUlt = inputs.some((i) => i.category === "skill" && i.ref?.endsWith("R"));

  // 스킬 목록 (레벨 추론용)
  const skills = [...new Set(inputs.filter((i) => i.category === "skill").map((i) => i.ref).filter(Boolean))];

  const durationSec = durationMs ? (durationMs / 1000).toFixed(1) : null;

  const prompt = `당신은 리그 오브 레전드 콤보 공유 플랫폼의 AI 보조입니다.
아래 콤보 정보를 분석해서 JSON으로만 응답하세요. 설명이나 마크다운 없이 순수 JSON만 출력.

## 입력 정보
- 챔피언: ${character}
- 입력 시퀀스: ${inputDesc || "(없음)"}
- 총 입력 수: ${inputCount}개
- 콤보 시간: ${durationSec ? `${durationSec}초` : "알 수 없음"}
- 사용된 스킬: ${skills.join(", ") || "없음"}
- 평캔 포함: ${hasCancelPattern ? "예" : "아니오"}
- 플래시 사용: ${hasFlash ? "예" : "아니오"}
- 궁극기 사용: ${hasUlt ? "예" : "아니오"}
${patch ? `- 패치: ${patch}` : ""}

## 응답 JSON 형식
{
  "title": "콤보 제목 (10~30자, 한국어)",
  "description": "콤보 설명 (40~100자, 한국어, 언제/어떻게 쓰는지 + 주의사항)",
  "difficulty": "easy | medium | hard",
  "tags": ["태그1", "태그2"],
  "required_level": 숫자 (1~18, 궁극기 있으면 6 이상),
  "difficulty_reason": "난이도 판단 이유 한 줄"
}

## 난이도 기준
- easy: 입력 5개 이하, 평캔 없음, 기본 스킬 연계
- medium: 입력 6~12개 또는 평캔 포함 또는 플래시 연계
- hard: 입력 13개 이상 또는 복잡한 평캔 + 플래시 조합`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text ?? "";

    // JSON 파싱 (마크다운 코드블록 처리)
    const jsonStr = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr) as {
      title: string;
      description: string;
      difficulty: "easy" | "medium" | "hard";
      tags: string[];
      required_level: number;
    };

    return NextResponse.json({
      title: parsed.title ?? "",
      description: parsed.description ?? "",
      difficulty: ["easy", "medium", "hard"].includes(parsed.difficulty) ? parsed.difficulty : "medium",
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
      required_level: typeof parsed.required_level === "number" ? parsed.required_level : null,
    });
  } catch (err) {
    return serverError(err);
  }
}
