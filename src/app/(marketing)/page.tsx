import { Hero } from "@/components/home/hero";
import { FeaturedRoutes } from "@/components/home/featured-routes";
import { MapPreview } from "@/components/home/map-preview";
import { UpcomingEvents } from "@/components/home/upcoming-events";
import { CtaBand } from "@/components/home/footer";
import { getFeaturedRoutes, getUpcomingEvents, getSiteStats, getHeroRoute } from "@/lib/queries";
import { getMapRoutes } from "@/lib/map-data";
import { createClient } from "@/lib/supabase/server";

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

  return (
    <>
      <Hero stats={stats} route={heroRoute} />
      <FeaturedRoutes routes={routes} />
      <MapPreview routes={mapRoutes} />
      <UpcomingEvents events={events} />
      <CtaBand authed={authed} />
    </>
  );
}
