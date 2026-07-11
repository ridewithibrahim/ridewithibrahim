import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RideTracker } from "@/components/ride/ride-tracker";
import { getLang } from "@/lib/i18n-server";

export const metadata = { title: "Sürüş Modu — RideWithIbrahim" };

type GeoLine = { type: "LineString"; coordinates: [number, number][] };

export default async function RidePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lang = await getLang();
  const supabase = await createClient();

  const { data: route } = await supabase
    .from("routes")
    .select("id, title, distance_m, path")
    .eq("id", id)
    .maybeSingle<{ id: string; title: string; distance_m: number; path: GeoLine | null }>();

  if (!route) notFound();
  const coords = route.path?.coordinates ?? [];
  if (coords.length < 2) notFound();

  return (
    <main className="ride-page">
      <RideTracker
        mode="follow"
        lang={lang}
        route={{ id: route.id, title: route.title, coords, distanceM: route.distance_m }}
      />
    </main>
  );
}
