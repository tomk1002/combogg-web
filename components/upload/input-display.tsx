"use client";

import Image from "next/image";
import type { ParsedInput } from "@/lib/tutfile";
import { getItemIconUrl } from "@/lib/games/lol/ddragon";

export const INPUT_CATEGORIES = [
  { value: "skill",          label: "스킬" },
  { value: "attack",         label: "평타" },
  { value: "attack_cancel",  label: "평캔" },
  { value: "item",           label: "아이템" },
  { value: "summoner_spell", label: "소환사 주문" },
  { value: "move",           label: "이동" },
  { value: "recall",         label: "귀환" },
  { value: "ward",           label: "와드" },
] as const;

export type InputCategory = (typeof INPUT_CATEGORIES)[number]["value"];

interface InputIconProps {
  input: ParsedInput;
  size?: "sm" | "md";
  /** LoL 패치. item.ref가 있을 때 아이템 아이콘 URL 조립에 사용. 없으면 텍스트 라벨 폴백. */
  patch?: string | null;
}

/**
 * 작은 입력 아이콘 표시. 타임라인 마커·미리보기에서 재사용.
 *
 * 디자인 토큰 대신 Tailwind color 유틸을 직접 쓴다 — 카테고리별 시각 구분이
 * 우선이고, gold/border 같은 의미가 없는 단순 ID 라벨이기 때문.
 */
export function InputIcon({ input, size = "sm", patch }: InputIconProps) {
  const { category, ref, slot } = input;
  const px = size === "sm" ? "px-1" : "px-1.5";
  const text = size === "sm" ? "text-[10px]" : "text-xs";
  const dim = size === "sm" ? 20 : 26;
  const base = `inline-flex items-center justify-center ${px} ${text} font-bold rounded leading-none h-5 min-w-[20px]`;

  switch (category) {
    case "skill": {
      // ref 가 RivenQ → Q, RivenR → R 처럼 끝글자 추출
      const match = ref?.match(/([QWERqwer])\d*$/);
      const key = match ? match[1].toUpperCase() : "?";
      const isUlt = key === "R";
      return (
        <span className={`${base} ${isUlt ? "bg-amber-700 text-amber-100" : "bg-blue-600 text-white"}`}>
          {key}
        </span>
      );
    }
    case "attack":
      return <span className={`${base} bg-yellow-600 text-white`}>AA</span>;
    case "attack_cancel":
      return <span className={`${base} bg-orange-600 text-white`}>AC</span>;
    case "item":
      if (ref && patch) {
        return (
          <Image
            src={getItemIconUrl(ref, patch)}
            alt={`Item ${ref}`}
            width={dim}
            height={dim}
            sizes={`${dim}px`}
            className="rounded"
          />
        );
      }
      return (
        <span className={`${base} bg-gray-600 text-white`}>
          I{slot ?? ""}
        </span>
      );
    case "summoner_spell":
      return (
        <span className={`${base} bg-purple-600 text-white`}>
          {(slot ?? "S").toString().toUpperCase()}
        </span>
      );
    case "move":
      return <span className={`${base} bg-emerald-700 text-white`}>MV</span>;
    case "recall":
      return <span className={`${base} bg-cyan-700 text-white`}>RC</span>;
    case "ward":
      return <span className={`${base} bg-green-700 text-white`}>WD</span>;
    default:
      return (
        <span className={`${base} bg-zinc-600 text-white`}>
          {category.slice(0, 2).toUpperCase()}
        </span>
      );
  }
}
