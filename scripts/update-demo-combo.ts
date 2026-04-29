import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, serviceKey);

  // 썸네일 업로드
  const imgPath = path.resolve("C:/Users/tomkwon/Downloads/삼각살썸네일.jpg");
  const imgBuffer = fs.readFileSync(imgPath);
  const storagePath = `demo/leesin-triangleshot.jpg`;

  const { error: uploadErr } = await supabase.storage
    .from("thumbnails")
    .upload(storagePath, imgBuffer, {
      contentType: "image/jpeg",
      upsert: true,
    });
  if (uploadErr) throw new Error(`썸네일 업로드 실패: ${uploadErr.message}`);

  const { data: urlData } = supabase.storage.from("thumbnails").getPublicUrl(storagePath);
  const thumbnailUrl = urlData.publicUrl;
  console.log(`✓ 썸네일 업로드: ${thumbnailUrl}`);

  // 콤보 업데이트
  const updated = await prisma.combo.update({
    where: { id: "cmojn9gbn0001rkz40gp7yxlm" },
    data: {
      thumbnailUrl,
      gameSpecific: {
        required_level: 6,
        required_skills: { R: 1, Q: 1 },
        summoner_spells: ["SummonerFlash", "SummonerSmite"],
      },
    },
  });

  console.log(`✓ 콤보 업데이트: ${updated.id}`);
  console.log(`  thumbnailUrl: ${updated.thumbnailUrl}`);
  console.log(`  gameSpecific: ${JSON.stringify(updated.gameSpecific, null, 2)}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
