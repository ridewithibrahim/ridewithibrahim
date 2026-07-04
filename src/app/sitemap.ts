import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

const SITE = "https://ridewithibrahim.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    "", "/rotalar", "/harita", "/bulusmalar", "/liderlik",
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
        .select("id, created_at")
        .order("created_at", { ascending: false })
        .limit(1000)
        .returns<{ id: string; created_at: string }[]>(),
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

    const eventPages: MetadataRoute.Sitemap = (events ?? []).map((e) => ({
      url: `${SITE}/bulusmalar/${e.id}`,
      lastModified: new Date(e.created_at),
      changeFrequency: "weekly",
      priority: 0.5,
    }));

    return [...staticPages, ...routePages, ...eventPages];
  } catch {
    return staticPages;
  }
}
