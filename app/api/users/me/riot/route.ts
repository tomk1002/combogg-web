import { Prisma } from "@prisma/client";
import { getSession } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/db";
import { ok, badRequest, unauthorized, serverError, notFound } from "@/lib/api/response";
import { getLatestPatch } from "@/lib/games/lol/ddragon";

const RIOT_API_KEY = (process.env.RIOT_API_KEY ?? "").trim();

interface MasteryEntry {
  championId: number;
  championName: string;
  championIconUrl: string | null;
  points: number;
  level: number;
}

interface RiotData {
  summonerId: string | null;
  summonerIconId: number | null;
  tier: string | null;
  rank: string | null;
  lp: number | null;
  topMasteries: MasteryEntry[];
}

async function fetchRiotData(puuid: string): Promise<RiotData> {
  // 소환사 정보 + 숙련도 병렬 조회
  const [summonerRes, masteryRes] = await Promise.all([
    fetch(`https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      { headers: { "X-Riot-Token": RIOT_API_KEY }, cache: "no-store" }),
    fetch(`https://kr.api.riotgames.com/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=3`,
      { headers: { "X-Riot-Token": RIOT_API_KEY }, cache: "no-store" }),
  ]);

  let summonerId: string | null = null;
  let summonerIconId: number | null = null;
  if (summonerRes.ok) {
    const s = await summonerRes.json() as { id: string; profileIconId: number };
    summonerId = s.id;
    summonerIconId = s.profileIconId;
  }

  // 랭크 조회 (summonerId 필요)
  let tier: string | null = null;
  let rank: string | null = null;
  let lp: number | null = null;
  if (summonerId) {
    const rankedRes = await fetch(
      `https://kr.api.riotgames.com/lol/league/v4/entries/by-summoner/${summonerId}`,
      { headers: { "X-Riot-Token": RIOT_API_KEY }, cache: "no-store" }
    );
    if (rankedRes.ok) {
      const entries = await rankedRes.json() as { queueType: string; tier: string; rank: string; leaguePoints: number }[];
      const solo = entries.find(e => e.queueType === "RANKED_SOLO_5x5");
      if (solo) { tier = solo.tier; rank = solo.rank; lp = solo.leaguePoints; }
    }
  }

  // 챔피언 숙련도 → 아이콘 해석
  let topMasteries: MasteryEntry[] = [];
  if (masteryRes.ok) {
    const masteryData = await masteryRes.json() as { championId: number; championPoints: number; championLevel: number }[];
    if (masteryData.length > 0) {
      try {
        const patch = await getLatestPatch();
        const champRes = await fetch(`https://ddragon.leagueoflegends.com/cdn/${patch}/data/ko_KR/champion.json`);
        const champJson = await champRes.json() as { data: Record<string, { key: string; name: string; id: string }> };
        const champById = Object.fromEntries(
          Object.values(champJson.data).map(c => [c.key, c])
        );
        topMasteries = masteryData.map(m => {
          const champ = champById[String(m.championId)];
          return {
            championId: m.championId,
            championName: champ?.name ?? `Champion ${m.championId}`,
            championIconUrl: champ
              ? `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${champ.id}.png`
              : null,
            points: m.championPoints,
            level: m.championLevel,
          };
        });
      } catch { /* 챔피언 데이터 실패해도 계속 */ }
    }
  }

  return { summonerId, summonerIconId, tier, rank, lp, topMasteries };
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.gameName || !body?.tagLine) return badRequest("gameName과 tagLine이 필요합니다");
  const { gameName, tagLine } = body as { gameName: string; tagLine: string };

  if (!RIOT_API_KEY) return badRequest("Riot API 키가 설정되지 않았습니다");

  try {
    const accountRes = await fetch(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers: { "X-Riot-Token": RIOT_API_KEY }, cache: "no-store" }
    );

    if (accountRes.status === 404) return badRequest("라이엇 계정을 찾을 수 없습니다. 게임명과 태그를 확인해주세요.");
    if (!accountRes.ok) {
      const body = await accountRes.text().catch(() => "");
      console.error("[Riot API]", accountRes.status, body, "key_length:", RIOT_API_KEY.trim().length);
      return badRequest(`라이엇 API 오류 (${accountRes.status})`);
    }

    const account = await accountRes.json() as { puuid: string; gameName: string; tagLine: string };
    const data = await fetchRiotData(account.puuid);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        riotPuuid: account.puuid,
        riotGameName: account.gameName,
        riotTagLine: account.tagLine,
        ...(data.summonerId && { riotSummonerId: data.summonerId }),
        ...(data.summonerIconId !== null && { riotSummonerIconId: data.summonerIconId }),
        ...(data.tier && { riotTier: data.tier }),
        ...(data.rank && { riotRank: data.rank }),
        ...(data.lp !== null && { riotLP: data.lp }),
        riotTopMasteries: data.topMasteries as unknown as object[],
      },
    });

    return ok({
      gameName: account.gameName,
      tagLine: account.tagLine,
      summonerIconId: data.summonerIconId,
      tier: data.tier,
      rank: data.rank,
      lp: data.lp,
      topMasteries: data.topMasteries,
    });
  } catch (err) {
    return serverError(err);
  }
}

// 저장된 PUUID로 랭크·숙련도 새로고침
export async function PUT() {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  if (!RIOT_API_KEY) return badRequest("Riot API 키가 설정되지 않았습니다");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { riotPuuid: true, riotGameName: true, riotTagLine: true },
  });
  if (!user?.riotPuuid) return notFound();

  try {
    const data = await fetchRiotData(user.riotPuuid);

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.summonerId && { riotSummonerId: data.summonerId }),
        ...(data.summonerIconId !== null && { riotSummonerIconId: data.summonerIconId }),
        riotTier: data.tier,
        riotRank: data.rank,
        riotLP: data.lp,
        riotTopMasteries: data.topMasteries as unknown as object[],
      },
    });

    return ok({
      gameName: user.riotGameName,
      tagLine: user.riotTagLine,
      summonerIconId: data.summonerIconId,
      tier: data.tier,
      rank: data.rank,
      lp: data.lp,
      topMasteries: data.topMasteries,
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  try {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        riotPuuid: null, riotGameName: null, riotTagLine: null,
        riotSummonerId: null, riotSummonerIconId: null,
        riotTier: null, riotRank: null, riotLP: null, riotTopMasteries: Prisma.DbNull,
      },
    });
    return ok({ unlinked: true });
  } catch (err) {
    return serverError(err);
  }
}
