import path from "node:path";
import type { NextConfig } from "next";

function getSupabaseHost(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL || "ufzroumxehomggrxsoin.supabase.co";
  const cleaned = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^['"]|['"]$/g, "").trim();
  return cleaned || "ufzroumxehomggrxsoin.supabase.co";
}

const supabaseHost = getSupabaseHost();

const nextConfig: NextConfig = {
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
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
