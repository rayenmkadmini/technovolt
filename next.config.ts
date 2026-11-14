import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function getConfiguredHostnames(): string[] {
  const candidates = [
    process.env.NEXT_PUBLIC_MEDIA_URL,
    process.env.NEXT_PUBLIC_MEDIA_PUBLIC_URL,
    process.env.R2_PUBLIC_URL,
    process.env.NEXT_PUBLIC_CLOUDFLARE_IMAGE_ZONE,
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SITE_URL,
  ];
  const hosts = new Set<string>([
    "technovolt.tn",
    "www.technovolt.tn",
    "media.technovolt.tn",
  ]);

  for (const raw of candidates) {
    if (!raw) continue;
    try {
      const parsed = new URL(raw.trim());
      if (parsed.hostname && !parsed.hostname.endsWith(".r2.dev")) {
        hosts.add(parsed.hostname);
      }
    } catch {
      // Ignore invalid env URLs during config loading
    }
  }
  return Array.from(hosts);
}

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: "*.supabase.co" },
  ...getConfiguredHostnames().map((hostname) => ({
    protocol: "https" as const,
    hostname,
  })),
];

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "X-Frame-Options",
          value: "SAMEORIGIN",
        },
        {
          key: "X-XSS-Protection",
          value: "1; mode=block",
        },
        {
          key: "Referrer-Policy",
          value: "strict-origin-when-cross-origin",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=()",
        },
      ],
    },
  ],
};

export default withNextIntl(nextConfig);
