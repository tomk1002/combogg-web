import Image from "next/image";
import type { LolGameSpecific } from "@/lib/games/lol/schema";
import { getAllItems } from "@/lib/games/lol/ddragon";

const SPELL_LABELS: Record<string, string> = {
  SummonerFlash:   "점멸",
  SummonerDot:     "점화",
  SummonerExhaust: "탈진",
  SummonerHaste:   "유체화",
  SummonerHeal:    "회복",
  SummonerBarrier: "방어막",
  SummonerTeleport:"순간이동",
  SummonerSmite:   "강타",
  SummonerBoost:   "청정제",
};

interface Props {
  gameSpecific: Partial<LolGameSpecific>;
  patch?: string;
}

const SKILL_LABELS: Record<string, string> = { Q: "Q", W: "W", E: "E", R: "R" };

export default async function LolConditions({ gameSpecific, patch = "16.8.1" }: Props) {
  const { required_level, ability_haste_min, attack_speed_min, summoner_spells, required_items, required_skills } = gameSpecific;

  const hasStats  = required_level || ability_haste_min || attack_speed_min;
  const hasSpells = summoner_spells && summoner_spells.length > 0;
  const hasItems  = required_items && required_items.length > 0;
  const hasSkills = required_skills && Object.keys(required_skills).length > 0;

  if (!hasStats && !hasSpells && !hasItems && !hasSkills) return null;

  let itemNameMap: Map<string, string> = new Map();
  if (hasItems) {
    try {
      const allItems = await getAllItems(patch);
      allItems.forEach((item) => itemNameMap.set(item.id, item.name));
    } catch {
      // fallback: show IDs
    }
  }

  return (
    <div className="bg-surface-raised rounded-xl p-5 border border-border">
      <h2 className="text-xs font-bold uppercase tracking-wide text-text-secondary mb-4">조건</h2>
      <div className="flex flex-col gap-4">

        {hasStats && (
          <div className="grid grid-cols-3 gap-2">
            {required_level && (
              <div className="bg-surface-overlay rounded-lg p-3 text-center">
                <p className="text-lg font-black">{required_level}</p>
                <p className="text-[10px] text-text-muted mt-0.5">최소 레벨</p>
              </div>
            )}
            {ability_haste_min && (
              <div className="bg-surface-overlay rounded-lg p-3 text-center">
                <p className="text-lg font-black">{ability_haste_min}</p>
                <p className="text-[10px] text-text-muted mt-0.5">스킬 가속</p>
              </div>
            )}
            {attack_speed_min && (
              <div className="bg-surface-overlay rounded-lg p-3 text-center">
                <p className="text-lg font-black">{attack_speed_min}</p>
                <p className="text-[10px] text-text-muted mt-0.5">공격 속도</p>
              </div>
            )}
          </div>
        )}

        {hasSpells && (
          <div>
            <p className="text-[10px] font-semibold text-text-muted mb-2">소환사 주문</p>
            <div className="flex gap-2 flex-wrap">
              {summoner_spells!.map((spell) => (
                <div key={spell} className="flex items-center gap-1.5 bg-surface-overlay rounded-lg px-2.5 py-1.5">
                  <Image
                    src={`https://ddragon.leagueoflegends.com/cdn/${patch}/img/spell/${spell}.png`}
                    alt={spell}
                    width={20}
                    height={20}
                    className="rounded-sm"
                  />
                  <span className="text-xs font-semibold">{SPELL_LABELS[spell] ?? spell}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasItems && (
          <div>
            <p className="text-[10px] font-semibold text-text-muted mb-2">필요 아이템</p>
            <div className="flex gap-2 flex-wrap">
              {required_items!.map((itemId) => (
                <div key={itemId} className="flex items-center gap-1.5 bg-surface-overlay rounded-lg px-2.5 py-1.5">
                  <Image
                    src={`https://ddragon.leagueoflegends.com/cdn/${patch}/img/item/${itemId}.png`}
                    alt={itemId}
                    width={20}
                    height={20}
                    className="rounded-sm"
                  />
                  <span className="text-xs font-semibold">{itemNameMap.get(itemId) ?? itemId}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasSkills && (
          <div>
            <p className="text-[10px] font-semibold text-text-muted mb-2">필요 스킬 레벨</p>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(required_skills!).map(([skill, level]) => (
                <div key={skill} className="flex items-center gap-1 bg-surface-overlay rounded-lg px-2.5 py-1.5">
                  <span className="text-xs font-black text-gold">{SKILL_LABELS[skill] ?? skill}</span>
                  <span className="text-xs font-semibold text-text-muted">Lv.{level}+</span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
