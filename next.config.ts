import path from "node:path";
import type { NextConfig } from "next";

function getSupabaseHost(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "ufzroumxehomggrxsoin.supabase.co";
  const cleaned = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^['"]|['"]$/g, "").trim();
  return cleaned || "ufzroumxehomggrxsoin.supabase.co";
}

const supabaseHost = getSupabaseHost();

const nextConfig: NextConfig = {
  // Do not use output: "standalone" on Vercel; it causes ENOENT: next-server.js.nft.json
  // Only enable if explicitly building a standalone container outside Vercel
  ...(process.env.BUILD_STANDALONE === "true" && !process.env.VERCEL
    ? { output: "standalone" as const }
    : {}),
  turbopack: { root: path.resolve(process.cwd()) },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseHost,
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "ufzroumxehomggrxsoin.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "thumb.wikimedia.org",
        pathname: "/**",
      },
    ],
  },

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
