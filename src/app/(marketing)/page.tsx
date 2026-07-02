import { Hero } from "@/components/home/hero";
import { FeaturedRoutes } from "@/components/home/featured-routes";
import { MapPreview } from "@/components/home/map-preview";
import { UpcomingEvents } from "@/components/home/upcoming-events";
import { CtaBand } from "@/components/home/footer";
import { getFeaturedRoutes, getUpcomingEvents } from "@/lib/queries";
import { getMapRoutes } from "@/lib/map-data";

export default async function HomePage() {
  const [routes, events, mapRoutes] = await Promise.all([
    getFeaturedRoutes(4),
    getUpcomingEvents(3),
    getMapRoutes(),
  ]);

  return (
    <>
      <Hero />
      <FeaturedRoutes routes={routes} />
      <MapPreview routes={mapRoutes} />
      <UpcomingEvents events={events} />
      <CtaBand />
    </>
  );
}
