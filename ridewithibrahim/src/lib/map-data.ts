import { createClient } from "@/lib/supabase/server";
import type { RouteType, Difficulty } from "@/lib/types";

export interface MapRoute {
  id: string;
  title: string;
  province: string;
  type: RouteType;
  difficulty: Difficulty;
  distanceM: number;
  elevationGainM: number;
  durationMin: number;
  likes: number;
  coords: [number, number][]; // LineString [lng, lat]
}

type GeoLine = { type: "LineString"; coordinates: [number, number][] };

type MapRouteRow = {
  id: string;
  title: string;
  province: string;
  route_type: RouteType;
  difficulty: Difficulty;
  distance_m: number;
  elevation_gain_m: number;
  duration_min: number;
  likes_count: number;
  path: unknown;
};

export async function getMapRoutes(): Promise<MapRoute[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("routes")
      .select(
        "id, title, province, route_type, difficulty, distance_m, elevation_gain_m, duration_min, likes_count, path",
      )
      .limit(500);

    if (error || !data?.length) return [];

    return (data as MapRouteRow[])
      .map((r) => {
        // Supabase returns PostGIS geometry columns as GeoJSON.
        const geo = r.path as GeoLine | null;
        const coords = geo?.coordinates ?? [];
        if (coords.length < 2) return null;
        return {
          id: r.id,
          title: r.title,
          province: r.province,
          type: r.route_type,
          difficulty: r.difficulty,
          distanceM: r.distance_m,
          elevationGainM: r.elevation_gain_m,
          durationMin: r.duration_min,
          likes: r.likes_count,
          coords,
        } satisfies MapRoute;
      })
      .filter((r): r is MapRoute => r !== null);
  } catch {
    return [];
  }
}
