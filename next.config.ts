import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "cdn.discordapp.com" },
      { hostname: "ddragon.leagueoflegends.com" },
      { hostname: "*.supabase.co" },
    ],
  },
};

export default nextConfig;
