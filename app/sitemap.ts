import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.AUTH_URL ?? "https://combogg-web.vercel.app").replace(/\/$/, "");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      priority: 1.0,
      changeFrequency: "daily",
    },
    {
      url: `${base}/games/lol`,
      priority: 0.9,
      changeFrequency: "daily",
    },
    {
      url: `${base}/download`,
      priority: 0.6,
      changeFrequency: "monthly",
    },
  ];

  const [combos, characters] = await Promise.all([
    prisma.combo.findMany({
      where: { status: "published" },
      select: { id: true, updatedAt: true },
      take: 5000,
    }),
    prisma.character.findMany({
      where: { game: { slug: "lol" } },
      select: { slug: true },
    }),
  ]);

  const comboRoutes: MetadataRoute.Sitemap = combos.map((combo) => ({
    url: `${base}/combos/${combo.id}`,
    lastModified: combo.updatedAt,
    priority: 0.7,
    changeFrequency: "weekly",
  }));

  const championRoutes: MetadataRoute.Sitemap = characters.map((char) => ({
    url: `${base}/games/lol/champions/${char.slug}`,
    priority: 0.5,
    changeFrequency: "weekly",
  }));

  return [...staticRoutes, ...comboRoutes, ...championRoutes];
}
