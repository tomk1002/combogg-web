import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Security headers for all routes
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      // No-cache for API routes to prevent sensitive data caching in intermediaries
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
        ],
      },
      // CORS for Overwolf desktop app API access.
      // Access-Control-Allow-Credentials is intentionally NOT set,
      // preventing session cookie forwarding from third-party sites.
      // Write endpoints are protected by Bearer token or session auth independently.
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
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
