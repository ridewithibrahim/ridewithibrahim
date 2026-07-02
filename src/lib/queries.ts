import { createClient } from "@/lib/supabase/server";
import { MOCK_ROUTES, MOCK_EVENTS } from "@/lib/mock";
import type { RouteSummary, EventSummary, RouteType, Difficulty } from "@/lib/types";

export interface RouteFilters {
  type?: RouteType;
  difficulty?: Difficulty;
  province?: string;
  distance?: string; // "0-25" | "25-50" | "50-100" | "100+"
}

const DIST_RANGES: Record<string, [number, number | null]> = {
  "0-25": [0, 25000],
  "25-50": [25000, 50000],
  "50-100": [50000, 100000],
  "100+": [100000, null],
};

const ROUTE_COLS =
  "id, user_id, title, province, route_type, difficulty, distance_m, elevation_gain_m, duration_min, likes_count, thumbnail_url";

type RouteRow = {
  id: string; user_id: string; title: string; province: string; route_type: RouteType; difficulty: Difficulty;
  distance_m: number; elevation_gain_m: number; duration_min: number; likes_count: number; thumbnail_url: string | null;
};

function mapRoute(r: RouteRow): RouteSummary {
  return {
    id: r.id,
    title: r.title,
    province: r.province,
    routeType: r.route_type,
    difficulty: r.difficulty,
    distanceM: r.distance_m,
    elevationGainM: r.elevation_gain_m,
    durationMin: r.duration_min,
    likesCount: r.likes_count,
    thumbnailUrl: r.thumbnail_url,
  };
}

/** Attach author usernames + the current user's saved flag (two small queries). */
async function enrich(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: RouteRow[],
): Promise<RouteSummary[]> {
  if (!rows.length) return [];
  const routes = rows.map(mapRoute);
  const ids = rows.map((r) => r.id);

  // authors
  const userIds = [...new Set(rows.map((r) => r.user_id))];
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, username")
    .in("id", userIds);
  const authorMap = new Map(
    (profs ?? []).map((p) => [p.id as string, p.username as string]),
  );

  // saved (only if logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let savedSet = new Set<string>();
  if (user) {
    const { data: saves } = await supabase
      .from("route_saves")
      .select("route_id")
      .eq("user_id", user.id)
      .in("route_id", ids);
    savedSet = new Set((saves ?? []).map((s) => s.route_id as string));
  }

  return routes.map((r, i) => ({
    ...r,
    authorUsername: authorMap.get(rows[i].user_id),
    saved: savedSet.has(r.id),
  }));
}

/** Filtered route listing for /rotalar. Returns [] on error/empty. */
export async function getRoutes(f: RouteFilters = {}): Promise<RouteSummary[]> {
  try {
    const supabase = await createClient();
    let q = supabase
      .from("routes")
      .select(ROUTE_COLS)
      .order("created_at", { ascending: false })
      .limit(60);

    if (f.type) q = q.eq("route_type", f.type);
    if (f.difficulty) q = q.eq("difficulty", f.difficulty);
    if (f.province) q = q.ilike("province", `%${f.province}%`);
    if (f.distance && DIST_RANGES[f.distance]) {
      const [min, max] = DIST_RANGES[f.distance];
      q = q.gte("distance_m", min);
      if (max !== null) q = q.lte("distance_m", max);
    }

    const { data, error } = await q;
    if (error || !data) return [];
    return enrich(supabase, data as RouteRow[]);
  } catch {
    return [];
  }
}

export async function getUserRoutes(userId: string): Promise<RouteSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("routes")
      .select(ROUTE_COLS)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error || !data) return [];
    return enrich(supabase, data as RouteRow[]);
  } catch {
    return [];
  }
}

export async function getFeaturedRoutes(limit = 4): Promise<RouteSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("routes")
      .select(ROUTE_COLS)
      .order("likes_count", { ascending: false })
      .limit(limit);

    if (error || !data?.length) return MOCK_ROUTES.slice(0, limit);
    return enrich(supabase, data as RouteRow[]);
  } catch {
    return MOCK_ROUTES.slice(0, limit);
  }
}

type EventRow = {
  id: string;
  title: string;
  event_type: RouteType;
  location: string;
  starts_at: string;
};

async function withAttendeeCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  rows: EventRow[],
): Promise<EventSummary[]> {
  const base = rows.map((e) => ({
    id: e.id,
    title: e.title,
    eventType: e.event_type,
    location: e.location,
    startsAt: e.starts_at,
    attendeeCount: 0,
  }));
  if (!rows.length) return base;

  const { data } = await supabase
    .from("event_attendees")
    .select("event_id")
    .eq("status", "gidiyor")
    .in(
      "event_id",
      rows.map((r) => r.id),
    );
  const counts = new Map<string, number>();
  for (const a of data ?? []) {
    const id = a.event_id as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return base.map((e) => ({ ...e, attendeeCount: counts.get(e.id) ?? 0 }));
}

export async function getUpcomingEvents(limit = 3): Promise<EventSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, title, event_type, location, starts_at")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(limit);

    if (error || !data?.length) return MOCK_EVENTS.slice(0, limit);
    return withAttendeeCounts(supabase, data as EventRow[]);
  } catch {
    return MOCK_EVENTS.slice(0, limit);
  }
}

export async function getEvents(): Promise<EventSummary[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, title, event_type, location, starts_at")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(100);
    if (error || !data?.length) return [];
    return withAttendeeCounts(supabase, data as EventRow[]);
  } catch {
    return [];
  }
}
