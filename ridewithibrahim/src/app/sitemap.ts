import type { MetadataRoute } from "next";

const SITE = "https://ridewithibrahim.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ["", "/rotalar", "/harita", "/bulusmalar", "/liderlik"].map((p) => ({
    url: `${SITE}${p}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: p === "" ? 1 : 0.8,
  }));
}
