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

// Same 10 routes as the tested prototype — used until the DB is seeded.
export const MOCK_MAP_ROUTES: MapRoute[] = [
  { id: "1", title: "Salda Gölü Çevre Turu", province: "Burdur · Yeşilova", type: "yol", difficulty: "kolay", distanceM: 34000, elevationGainM: 320, durationMin: 125, likes: 312, coords: [[29.66, 37.55], [29.7, 37.56], [29.72, 37.53], [29.68, 37.52]] },
  { id: "2", title: "Köprülü Kanyon MTB Hattı", province: "Antalya · Manavgat", type: "mtb", difficulty: "zor", distanceM: 27000, elevationGainM: 980, durationMin: 160, likes: 489, coords: [[31.16, 37.15], [31.19, 37.19], [31.22, 37.22]] },
  { id: "3", title: "Karadeniz Sahil Moto Turu", province: "Trabzon → Rize", type: "moto", difficulty: "orta", distanceM: 142000, elevationGainM: 610, durationMin: 175, likes: 726, coords: [[39.72, 41.0], [40.0, 41.02], [40.52, 41.02]] },
  { id: "4", title: "Kaçkar Kamp & Keşif", province: "Rize · Ayder", type: "kamp", difficulty: "uzman", distanceM: 61000, elevationGainM: 2140, durationMin: 2880, likes: 934, coords: [[41.1, 40.95], [41.13, 40.9], [41.16, 40.85]] },
  { id: "5", title: "Kartepe Zirve Tırmanışı", province: "Kocaeli · Kartepe", type: "yol", difficulty: "zor", distanceM: 48200, elevationGainM: 1240, durationMin: 190, likes: 604, coords: [[30.02, 40.62], [30.28, 40.68], [30.42, 40.63]] },
  { id: "6", title: "Assos Sahil Rotası", province: "Çanakkale · Ayvacık", type: "yol", difficulty: "kolay", distanceM: 29000, elevationGainM: 210, durationMin: 110, likes: 187, coords: [[26.3, 39.49], [26.35, 39.5], [26.4, 39.52]] },
  { id: "7", title: "Nemrut Krater Tırmanışı", province: "Bitlis · Tatvan", type: "mtb", difficulty: "zor", distanceM: 38000, elevationGainM: 1180, durationMin: 210, likes: 271, coords: [[42.2, 38.62], [42.24, 38.65], [42.28, 38.68]] },
  { id: "8", title: "Kapadokya Vadileri", province: "Nevşehir · Göreme", type: "mtb", difficulty: "orta", distanceM: 41000, elevationGainM: 540, durationMin: 150, likes: 418, coords: [[34.8, 38.63], [34.85, 38.65], [34.9, 38.66]] },
  { id: "9", title: "Abant Göl Turu", province: "Bolu · Abant", type: "yol", difficulty: "kolay", distanceM: 22000, elevationGainM: 260, durationMin: 80, likes: 233, coords: [[31.26, 40.6], [31.3, 40.61], [31.33, 40.62]] },
  { id: "10", title: "Datça Yarımada Moto", province: "Muğla · Datça", type: "moto", difficulty: "orta", distanceM: 96000, elevationGainM: 780, durationMin: 150, likes: 389, coords: [[27.6, 36.72], [27.68, 36.73], [27.75, 36.71]] },
];

type GeoLine = { type: "LineString"; coordinates: [number, number][] };

export async function getMapRoutes(): Promise<MapRoute[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("routes")
      .select(
        "id, title, province, route_type, difficulty, distance_m, elevation_gain_m, duration_min, likes_count, path",
      )
      .limit(500);

    if (error || !data?.length) return MOCK_MAP_ROUTES;

    return data
      .map((r) => {
        // Supabase returns PostGIS geometry columns as GeoJSON.
        const geo = r.path as GeoLine | null;
        const coords = geo?.coordinates ?? [];
        if (!coords.length) return null;
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
    return MOCK_MAP_ROUTES;
  }
}
