import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    // Eski sitenin adreslerini yeni sayfalara kalıcı yönlendir (SEO + kırık link koruması)
    return [
      { source: "/terms", destination: "/sartlar", permanent: true },
      { source: "/privacy", destination: "/gizlilik", permanent: true },
      { source: "/contact", destination: "/iletisim", permanent: true },
    ];
  },
};

export default nextConfig;
