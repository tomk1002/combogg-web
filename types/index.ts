export type Difficulty = "easy" | "medium" | "hard";

// tutfile 파싱 시 사용하는 타입 (카테고리가 명확히 알려진 경우)
export interface InputEntry {
  category:
    | "skill"
    | "attack"
    | "attack_cancel"
    | "item"
    | "summoner_spell"
    | "move"
    | "recall"
    | "ward";
  ref?: string;
  slot?: number | string;
}
