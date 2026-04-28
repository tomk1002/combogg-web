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
