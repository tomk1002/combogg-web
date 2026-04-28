export const LOL_INPUT_CATEGORIES = {
  skill:          { label: "스킬", iconType: "dynamic" as const },
  attack:         { label: "평타", iconType: "static" as const },
  attack_cancel:  { label: "평캔", iconType: "static" as const },
  item:           { label: "아이템", iconType: "dynamic" as const },
  summoner_spell: { label: "소환사 주문", iconType: "dynamic" as const },
  move:           { label: "이동", iconType: "static" as const },
  recall:         { label: "귀환", iconType: "static" as const },
  ward:           { label: "와드", iconType: "dynamic" as const },
} as const;

export type LolInputCategory = keyof typeof LOL_INPUT_CATEGORIES;
