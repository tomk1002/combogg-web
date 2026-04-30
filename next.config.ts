import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "cdn.discordapp.com" },
      { hostname: "ddragon.leagueoflegends.com" },
      { hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
