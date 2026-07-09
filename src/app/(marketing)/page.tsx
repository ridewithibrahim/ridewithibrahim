import { Hero } from "@/components/home/hero";
import { FeaturedRoutes } from "@/components/home/featured-routes";
import { MapPreview } from "@/components/home/map-preview";
import { UpcomingEvents } from "@/components/home/upcoming-events";
import { CtaBand } from "@/components/home/footer";
import { getFeaturedRoutes, getUpcomingEvents, getSiteStats, getHeroRoute } from "@/lib/queries";
import { getMapRoutes } from "@/lib/map-data";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n-server";

export const metadata = {
  alternates: { canonical: "/", languages: { tr: "/", en: "/en" } },
};

export default async function HomePage() {
  const supabase = await createClient();
  const [routes, events, mapRoutes, stats, heroRoute, userRes] = await Promise.all([
    getFeaturedRoutes(4),
    getUpcomingEvents(3),
    getMapRoutes(),
    getSiteStats(),
    getHeroRoute(),
    supabase.auth.getUser(),
  ]);
  const authed = !!userRes.data.user;
  const lang = await getLang();

  return (
    <>
      <Hero stats={stats} route={heroRoute} lang={lang} />
      <FeaturedRoutes routes={routes} lang={lang} />
      <MapPreview routes={mapRoutes} lang={lang} />
      <UpcomingEvents events={events} lang={lang} />
      <CtaBand authed={authed} lang={lang} />
    </>
  );
}
