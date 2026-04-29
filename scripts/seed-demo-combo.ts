import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "tkwon999@gmail.com" },
  });
  if (!user) throw new Error("User not found: tkwon999@gmail.com");

  const game = await prisma.game.findUnique({ where: { slug: "lol" } });
  if (!game) throw new Error("Game not found: lol — run pnpm db:seed first");

  const character = await prisma.character.findUnique({
    where: { gameId_slug: { gameId: game.id, slug: "leesin" } },
  });
  if (!character) throw new Error("Character not found: leesin");

  const patch = game.currentPatch ?? "15.8.1";

  const combo = await prisma.combo.create({
    data: {
      title: "리 신 삼각살 풀콤보",
      description: `## 삼각살이란?

Q를 맞힌 뒤, 와드/아군 W로 각을 꺾어 들어가 R로 적을 아군 쪽·벽 쪽으로 차서 마무리하는 콤보입니다.
직선 인섹이 아니라, Q를 맞힌 대상 기준으로 옆으로 꺾어 삼각형 각도를 만든 뒤 차는 것이 핵심입니다.

## 기본 스킬 순서

**Q1 → 와드 W → R → Q2 → E → 평타**

## 핵심 팁

- **Q2를 너무 빨리 쓰지 마세요.** R 이후에 써야 잃은 체력 비례 피해로 킬각이 잘 납니다.
- **와드는 적 바로 뒤가 아니라 '옆뒤'에 찍으세요.** 측면으로 꺾어 차는 것이 핵심입니다.
- **R 방향은 리 신과 적의 상대 위치로 결정됩니다.** 와드 W 위치가 콤보의 80%입니다.
- **확정형은 Q1 맞은 뒤 적 이동기를 본 뒤 진입.** Q1 적중 후 0.5~1초 기다리는 것도 좋습니다.

## 고급형: R점멸 삼각살

\`Q1 → 와드 W 옆각 → R점멸 → Q2\`

R 시전 직후 점멸로 리 신 위치를 바꿔 날아가는 방향을 순간 변경. 난이도는 높지만 반응하기 가장 어렵습니다.

## 마무리 풀콤보

\`Q1 → 와드W → R → Q2 → E → 평타 → 강타\`

정글이면 강타를 마지막에 섞어 딜 부족을 보완하세요.`,
      authorId: user.id,
      gameId: game.id,
      characterId: character.id,
      difficulty: "hard",
      tags: ["삼각살", "정글", "이니시에이팅", "인섹"],
      durationMs: 3500,
      inputCount: 7,
      inputSummary: [
        { category: "skill", ref: "LeeSinSonicWave" },
        { category: "ward" },
        { category: "skill", ref: "LeeSinSafeguard" },
        { category: "skill", ref: "LeeSinDragonRage" },
        { category: "skill", ref: "LeeSinResonatingStrike" },
        { category: "skill", ref: "LeeSinTempest" },
        { category: "attack" },
      ],
      gameSpecific: {
        required_level: 6,
        ability_haste_min: 0,
        summoner_spells: ["SummonerFlash", "SummonerSmite"],
      },
      patchVersion: patch,
      status: "published",
    },
  });

  console.log(`✓ 콤보 생성 완료: ${combo.id}`);
  console.log(`  제목: ${combo.title}`);
  console.log(`  작성자: ${user.nickname ?? user.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
