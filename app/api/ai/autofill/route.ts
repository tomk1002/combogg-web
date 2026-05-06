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

  const inputCount = inputs.length;
  const hasCancelPattern = inputs.some((i) => i.category === "attack_cancel");
  const hasFlash = inputs.some((i) => i.ref === "SummonerFlash");
  const hasUlt = inputs.some((i) => i.category === "skill" && i.ref?.endsWith("R"));
  const aaCount = inputs.filter((i) => i.category === "attack" || i.category === "attack_cancel").length;
  const skills = [...new Set(inputs.filter((i) => i.category === "skill").map((i) => i.ref).filter(Boolean))];

  // Extract items and summoner spells from the sequence for the client to use
  const detectedItems = [...new Set(inputs.filter((i) => i.category === "item" && i.ref).map((i) => i.ref as string))];
  const detectedSpells = [...new Set(inputs.filter((i) => i.category === "summoner_spell" && i.ref).map((i) => i.ref as string))];

  const inputDesc = inputs
    .slice(0, 35)
    .map((i) => i.ref ? `${i.category}(${i.ref})` : i.category)
    .join(" → ");

  const durationSec = durationMs ? (durationMs / 1000).toFixed(1) : null;

  const prompt = `당신은 리그 오브 레전드 콤보 공유 플랫폼의 AI 보조입니다.
아래 콤보 정보를 분석해서 JSON으로만 응답하세요. 설명이나 마크다운 없이 순수 JSON만 출력.

## 입력 정보
- 챔피언: ${character}
- 입력 시퀀스: ${inputDesc || "(없음)"}
- 총 입력 수: ${inputCount}개 (AA/평캔: ${aaCount}개)
- 콤보 시간: ${durationSec ? `${durationSec}초` : "알 수 없음"}
- 사용된 스킬: ${skills.join(", ") || "없음"}
- 평캔 포함: ${hasCancelPattern ? "예" : "아니오"}
- 플래시 사용: ${hasFlash ? "예" : "아니오"}
- 궁극기 사용: ${hasUlt ? "예" : "아니오"}
${patch ? `- 패치: ${patch}` : ""}

## 응답 JSON 형식
{
  "title": "콤보 제목 (10~30자, 한국어, 챔피언명 포함)",
  "description": "콤보 설명 (40~100자, 한국어, 사용 상황 + 핵심 타이밍 포함)",
  "difficulty": "easy | medium | hard",
  "tags": ["태그1", "태그2", "태그3"],
  "required_level": 숫자 (1~18, 궁극기 있으면 6/11/16 중 하나),
  "ability_haste_min": 숫자 또는 null (이 챔피언/콤보에 스킬 가속이 필요하면 권장 최솟값, 아니면 null),
  "attack_speed_min": 숫자 또는 null (평캔이 많아서 공격속도가 중요하면 권장 최솟값, 아니면 null)
}

## 판단 기준
### 난이도
- easy: 입력 5개 이하, 평캔 없음, 기본 스킬 연계
- medium: 입력 6~12개 또는 평캔 포함 또는 플래시 연계
- hard: 입력 13개 이상 또는 복잡한 평캔+플래시 조합 또는 극도로 타이트한 타이밍

### ability_haste_min 예시
- 리븐, 리 신, 야스오 등 짧은 쿨타임 스킬 체인에 민감한 챔피언: 10~20
- 기본 콤보(6레벨 1회성): null
- 단순 궁+점화: null

### attack_speed_min 예시
- 평캔이 3회 이상이고 공속이 콤보 완성에 영향을 줄 때: 1.2~1.5
- 평캔 없음 또는 1~2회: null`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text ?? "";
    const jsonStr = raw.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonStr) as {
      title: string;
      description: string;
      difficulty: "easy" | "medium" | "hard";
      tags: string[];
      required_level: number;
      ability_haste_min: number | null;
      attack_speed_min: number | null;
    };

    return NextResponse.json({
      title: parsed.title ?? "",
      description: parsed.description ?? "",
      difficulty: ["easy", "medium", "hard"].includes(parsed.difficulty) ? parsed.difficulty : "medium",
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 6) : [],
      required_level: typeof parsed.required_level === "number" ? parsed.required_level : null,
      ability_haste_min: typeof parsed.ability_haste_min === "number" ? parsed.ability_haste_min : null,
      attack_speed_min: typeof parsed.attack_speed_min === "number" ? parsed.attack_speed_min : null,
      // Pass through extracted items/spells for client to use
      detected_items: detectedItems,
      detected_spells: detectedSpells,
    });
  } catch (err) {
    return serverError(err);
  }
}
