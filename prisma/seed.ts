import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LOL_INPUT_CATEGORIES = [
  "skill",
  "attack",
  "attack_cancel",
  "item",
  "summoner_spell",
  "move",
  "recall",
  "ward",
];

async function main() {
  const versionsRes = await fetch(
    "https://ddragon.leagueoflegends.com/api/versions.json"
  );
  const versions: string[] = await versionsRes.json();
  const patch = versions[0];

  const championsRes = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${patch}/data/ko_KR/champion.json`
  );
  const championsData = await championsRes.json();
  const champions = Object.values(championsData.data) as Array<{
    id: string;
    name: string;
  }>;

  const game = await prisma.game.upsert({
    where: { slug: "lol" },
    update: { currentPatch: patch },
    create: {
      slug: "lol",
      name: "리그 오브 레전드",
      iconUrl: `https://ddragon.leagueoflegends.com/cdn/${patch}/img/profileicon/29.png`,
      currentPatch: patch,
      inputCategories: LOL_INPUT_CATEGORIES,
    },
  });

  console.log(`Game upserted: ${game.name} (patch ${patch})`);

  let created = 0;
  let skipped = 0;

  for (const champ of champions) {
    const slug = champ.id.toLowerCase();
    const iconUrl = `https://ddragon.leagueoflegends.com/cdn/${patch}/img/champion/${champ.id}.png`;

    const existing = await prisma.character.findUnique({
      where: { gameId_slug: { gameId: game.id, slug } },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await prisma.character.create({
      data: {
        gameId: game.id,
        slug,
        name: champ.name,
        iconUrl,
      },
    });
    created++;
  }

  console.log(
    `Champions: ${created} created, ${skipped} skipped (total ${champions.length})`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
