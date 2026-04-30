import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // 데스크톱 앱(Overwolf 오버레이)에서 API를 호출할 수 있도록 CORS 허용
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ];
  },
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
