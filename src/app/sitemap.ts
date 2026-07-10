import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { slugifyProvince } from "@/lib/slug";

const SITE = "https://ridewithibrahim.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    "", "/en", "/rotalar", "/harita", "/bulusmalar", "/liderlik",
    "/gizlilik", "/sartlar", "/iletisim",
  ].map((p) => ({
    url: `${SITE}${p}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: p === "" ? 1 : 0.8,
  }));

  try {
    const supabase = await createClient();
    const [{ data: routes }, { data: events }] = await Promise.all([
      supabase
        .from("routes")
        .select("id, created_at, province")
        .order("created_at", { ascending: false })
        .limit(1000)
        .returns<{ id: string; created_at: string; province: string }[]>(),
      supabase
        .from("events")
        .select("id, created_at")
        .limit(500)
        .returns<{ id: string; created_at: string }[]>(),
    ]);

    const routePages: MetadataRoute.Sitemap = (routes ?? []).map((r) => ({
      url: `${SITE}/rotalar/${r.id}`,
      lastModified: new Date(r.created_at),
      changeFrequency: "weekly",
      priority: 0.7,
    }));

    const provinces = [...new Set((routes ?? []).map((r) => r.province).filter(Boolean))];
    const provincePages: MetadataRoute.Sitemap = provinces.map((prov) => ({
      url: `${SITE}/rotalar/il/${slugifyProvince(prov)}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    }));

    const eventPages: MetadataRoute.Sitemap = (events ?? []).map((e) => ({
      url: `${SITE}/bulusmalar/${e.id}`,
      lastModified: new Date(e.created_at),
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    return [...staticPages, ...provincePages, ...routePages, ...eventPages];
  } catch {
    return staticPages;
  }
}
