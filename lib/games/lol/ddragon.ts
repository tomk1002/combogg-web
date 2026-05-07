const DDRAGON_BASE = "https://ddragon.leagueoflegends.com";

export async function getLatestPatch(): Promise<string> {
  const res = await fetch(`${DDRAGON_BASE}/api/versions.json`, {
    next: { revalidate: 3600 },
  });
  const versions: string[] = await res.json();
  return versions[0];
}

export function getSkillIconUrl(ref: string, patch: string) {
  return `${DDRAGON_BASE}/cdn/${patch}/img/spell/${ref}.png`;
}

export function getItemIconUrl(itemId: string, patch: string) {
  return `${DDRAGON_BASE}/cdn/${patch}/img/item/${itemId}.png`;
}

export function getSummonerSpellIconUrl(ref: string, patch: string) {
  return `${DDRAGON_BASE}/cdn/${patch}/img/spell/${ref}.png`;
}

export function getChampIconUrl(champId: string, patch: string) {
  return `${DDRAGON_BASE}/cdn/${patch}/img/champion/${champId}.png`;
}

export async function getAllChampions(patch: string) {
  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${patch}/data/ko_KR/champion.json`,
    { next: { revalidate: 3600 } }
  );
  const json = await res.json();
  return json.data as Record<string, { id: string; name: string; key: string }>;
}

interface DdragonItemData {
  name: string;
  gold: { purchasable: boolean; total: number };
  maps: Record<string, boolean>;
  tags?: string[];
  inStore?: boolean;
}

// 트링켓·와드(소모성 시야) 아이템 — gold.purchasable=false 라 일반 필터에서 빠짐
// Riot Data Dragon 기준: 3340 노란트링켓, 3363 푸른트링켓, 3364 오라클(스위퍼).
// 이 외에도 가끔 무료 슬롯에 들어가는 와드 류는 명시적으로 통과시킨다.
const ALLOWED_TRINKET_IDS = new Set(["3340", "3363", "3364"]);

export async function getAllItems(
  patch: string
): Promise<{ id: string; name: string; iconUrl: string }[]> {
  const res = await fetch(
    `${DDRAGON_BASE}/cdn/${patch}/data/ko_KR/item.json`,
    { next: { revalidate: 3600 } }
  );
  const json = await res.json();
  const data = json.data as Record<string, DdragonItemData>;
  return Object.entries(data)
    .filter(([id, item]) => {
      // 소환사 협곡(map 11)이어야 함
      if (item.maps["11"] !== true) return false;
      // 명시적으로 허용한 트링켓은 무조건 통과
      if (ALLOWED_TRINKET_IDS.has(id)) return true;
      // 그 외는 기존 필터: 구매 가능 + 총 골드 ≥ 400
      return item.gold.purchasable === true && item.gold.total >= 400;
    })
    .map(([id, item]) => ({
      id,
      name: item.name,
      iconUrl: getItemIconUrl(id, patch),
    }));
}
