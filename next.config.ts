import path from "node:path";
import type { NextConfig } from "next";

function getSupabaseHost(): string | undefined {
  const urlString = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!urlString) return undefined;

  try {
    // Automatically prepends https:// if missing before passing to URL constructor
    const formattedUrl = urlString.startsWith("http") ? urlString : `https://${urlString}`;
    return new URL(formattedUrl).hostname;
  } catch (err) {
    console.warn("Invalid NEXT_PUBLIC_SUPABASE_URL in next.config.ts:", urlString);
    return undefined;
  }
}

const supabaseHost = getSupabaseHost();

const nextConfig: NextConfig = {
  turbopack: { root: path.resolve(process.cwd()) },

  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
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
