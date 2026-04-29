import { getSession } from "@/lib/auth/require-auth";
import { prisma } from "@/lib/db";
import { ok, badRequest, unauthorized, serverError } from "@/lib/api/response";

const RIOT_API_KEY = process.env.RIOT_API_KEY ?? "";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session?.user?.id) return unauthorized();

  const body = await req.json().catch(() => null);
  if (!body?.gameName || !body?.tagLine) return badRequest("gameName과 tagLine이 필요합니다");

  const { gameName, tagLine } = body as { gameName: string; tagLine: string };

  if (!RIOT_API_KEY) return badRequest("Riot API 키가 설정되지 않았습니다");

  try {
    // 1. Riot Account API로 PUUID 조회
    const accountRes = await fetch(
      `https://asia.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`,
      { headers: { "X-Riot-Token": RIOT_API_KEY }, next: { revalidate: 0 } }
    );

    if (accountRes.status === 404) return badRequest("라이엇 계정을 찾을 수 없습니다. 게임명과 태그를 확인해주세요.");
    if (!accountRes.ok) return badRequest(`라이엇 API 오류 (${accountRes.status})`);

    const account = await accountRes.json() as { puuid: string; gameName: string; tagLine: string };

    // 2. 소환사 아이콘 ID 조회 (KR 서버)
    let summonerIconId: number | null = null;
    try {
      const summonerRes = await fetch(
        `https://kr.api.riotgames.com/lol/summoner/v4/summoners/by-puuid/${account.puuid}`,
        { headers: { "X-Riot-Token": RIOT_API_KEY }, next: { revalidate: 0 } }
      );
      if (summonerRes.ok) {
        const summoner = await summonerRes.json() as { profileIconId: number };
        summonerIconId = summoner.profileIconId;
      }
    } catch {
      // 소환사 정보 실패해도 계정 연동은 진행
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        riotPuuid: account.puuid,
        riotGameName: account.gameName,
        riotTagLine: account.tagLine,
        ...(summonerIconId !== null && { riotSummonerIconId: summonerIconId }),
      },
    });

    return ok({
      gameName: account.gameName,
      tagLine: account.tagLine,
      summonerIconId,
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
      data: { riotPuuid: null, riotGameName: null, riotTagLine: null, riotSummonerIconId: null },
    });
    return ok({ unlinked: true });
  } catch (err) {
    return serverError(err);
  }
}
