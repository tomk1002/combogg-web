"use client";

import type { LolGameSpecific } from "@/lib/games/lol/schema";

const COMMON_SUMMONER_SPELLS = [
  { id: "SummonerFlash",    label: "점멸" },
  { id: "SummonerDot",      label: "점화" },
  { id: "SummonerExhaust",  label: "탈진" },
  { id: "SummonerHaste",    label: "유체화" },
  { id: "SummonerHeal",     label: "회복" },
  { id: "SummonerBarrier",  label: "방어막" },
  { id: "SummonerSmite",    label: "강타" },
  { id: "SummonerTeleport", label: "순간이동" },
];

const SKILL_KEYS = ["Q", "W", "E", "R"] as const;

interface Props {
  value: Partial<LolGameSpecific>;
  onChange: (v: Partial<LolGameSpecific>) => void;
}

export default function LolUploadForm({ value, onChange }: Props) {
  const set = <K extends keyof LolGameSpecific>(key: K, v: LolGameSpecific[K] | undefined) =>
    onChange({ ...value, [key]: v });

  const toggleSpell = (id: string) => {
    const cur = value.summoner_spells ?? [];
    const next = cur.includes(id) ? cur.filter((s) => s !== id) : [...cur, id];
    set("summoner_spells", next.length ? next : undefined);
  };

  return (
    <div className="flex flex-col gap-5">
      <p className="text-xs font-bold uppercase tracking-wide text-text-secondary">
        LoL 조건 <span className="font-normal normal-case">(선택)</span>
      </p>

      {/* 레벨 */}
      <div className="grid grid-cols-3 gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-secondary">최소 레벨</span>
          <input
            type="number"
            min={1}
            max={18}
            placeholder="1 – 18"
            value={value.required_level ?? ""}
            onChange={(e) => set("required_level", e.target.value ? Number(e.target.value) : undefined)}
            className="h-9 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-secondary">최소 스킬 가속</span>
          <input
            type="number"
            min={0}
            placeholder="예: 20"
            value={value.ability_haste_min ?? ""}
            onChange={(e) => set("ability_haste_min", e.target.value ? Number(e.target.value) : undefined)}
            className="h-9 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-text-secondary">최소 공격 속도</span>
          <input
            type="number"
            min={0}
            step={0.1}
            placeholder="예: 1.5"
            value={value.attack_speed_min ?? ""}
            onChange={(e) => set("attack_speed_min", e.target.value ? Number(e.target.value) : undefined)}
            className="h-9 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
          />
        </label>
      </div>

      {/* 소환사 주문 */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-text-secondary">소환사 주문</span>
        <div className="flex gap-2 flex-wrap">
          {COMMON_SUMMONER_SPELLS.map((spell) => {
            const active = (value.summoner_spells ?? []).includes(spell.id);
            return (
              <button
                key={spell.id}
                type="button"
                onClick={() => toggleSpell(spell.id)}
                className={`px-3 py-1.5 rounded-full border text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? "bg-gold/20 border-gold/50 text-gold"
                    : "border-border text-text-secondary hover:border-[rgba(255,255,255,0.24)] hover:text-text"
                }`}
              >
                {spell.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 필요 아이템 (ID 기반, 쉼표 구분) */}
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold text-text-secondary">필요 아이템 ID</span>
        <input
          type="text"
          placeholder="예: 3142, 3814 (쉼표로 구분)"
          value={(value.required_items ?? []).join(", ")}
          onChange={(e) => {
            const ids = e.target.value.split(",").map((s) => s.trim()).filter(Boolean);
            set("required_items", ids.length ? ids : undefined);
          }}
          className="h-9 px-3 rounded-lg border border-border bg-surface-overlay text-sm focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
        />
        <p className="text-[10px] text-text-muted">Riot 아이템 ID. 예: 3142 (요마의 망토), 3814 (에지 오브 나이트)</p>
      </label>

      {/* 필요 스킬 레벨 */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-semibold text-text-secondary">필요 스킬 레벨</span>
        <div className="grid grid-cols-4 gap-2">
          {SKILL_KEYS.map((skill) => {
            const cur = (value.required_skills ?? {})[skill];
            return (
              <label key={skill} className="flex flex-col gap-1 items-center">
                <span className="text-xs font-black text-gold">{skill}</span>
                <select
                  value={cur ?? ""}
                  onChange={(e) => {
                    const next = { ...(value.required_skills ?? {}) };
                    if (e.target.value) next[skill] = Number(e.target.value);
                    else delete next[skill];
                    set("required_skills", Object.keys(next).length ? next : undefined);
                  }}
                  className="w-full h-9 px-2 rounded-lg border border-border bg-surface-overlay text-sm text-center focus:outline-none focus:border-[rgba(255,255,255,0.3)] transition-colors"
                >
                  <option value="">-</option>
                  {[1,2,3,4,5].map((lv) => (
                    <option key={lv} value={lv}>Lv.{lv}</option>
                  ))}
                </select>
              </label>
            );
          })}
        </div>
        <p className="text-[10px] text-text-muted">콤보에 필요한 최소 스킬 레벨. 예: R Lv.1 = 6레벨 이상</p>
      </div>
    </div>
  );
}
