import path from "node:path";
import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig: NextConfig = {
  // Without this Turbopack walks up to the home directory looking for a lockfile
  // and warns on every build. Pin the workspace root to this project.
  turbopack: { root: path.resolve(process.cwd()) },

  images: {
    // Venue logos in public/logos/ are local and need no entry here. This covers
    // logos you choose to host in Supabase storage instead.
    // `images.domains` is deprecated in Next 16 — remotePatterns is the replacement.
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },

  // Surface accidental cross-origin dev requests instead of silently allowing them.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The app needs no camera, mic or geolocation; deny them outright.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "X-Frame-Options", value: "DENY" },
        ],
      },
    ];
  },
};

export default nextConfig;
