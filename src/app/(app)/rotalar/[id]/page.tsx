import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DIFFICULTY, ROUTE_TYPES, km, formatDuration } from "@/lib/types";
import type { RouteType, Difficulty } from "@/lib/types";
import { RouteTypeIcon, PinIcon } from "@/components/home/icons";
import { RouteDetailMap } from "@/components/routes/route-detail-map";
import { ElevationChart } from "@/components/routes/elevation-chart";
import { LikeSaveButtons } from "@/components/routes/like-save-buttons";
import { Comments } from "@/components/routes/comments";

type GeoLine = { type: "LineString"; coordinates: [number, number][] };

type RouteRow = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  route_type: RouteType;
  difficulty: Difficulty;
  province: string;
  distance_m: number;
  elevation_gain_m: number;
  duration_min: number;
  path: GeoLine | null;
  gpx_url: string | null;
  likes_count: number;
  saves_count: number;
};

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error: routeErr } = await supabase
    .from("routes")
    .select("*")
    .eq("id", id)
    .single();

  if (routeErr || !data) notFound();
  const route = data as RouteRow;

  const path = route.path;
  const coords = path?.coordinates ?? [];
  const diff = DIFFICULTY[route.difficulty as keyof typeof DIFFICULTY];

  // author (ayrı sorgu — routes→profiles FK'sına bağımlı değil)
  let author: string | undefined;
  if (route.user_id) {
    const { data: prof } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", route.user_id)
      .maybeSingle();
    author = prof?.username ?? undefined;
  }

  // like/save state for the current user
  let liked = false;
  let saved = false;
  if (user) {
    const [{ data: l }, { data: s }] = await Promise.all([
      supabase.from("route_likes").select("route_id").eq("route_id", id).eq("user_id", user.id).maybeSingle(),
      supabase.from("route_saves").select("route_id").eq("route_id", id).eq("user_id", user.id).maybeSingle(),
    ]);
    liked = !!l;
    saved = !!s;
  }

  // comments (embed author if the FK exists, otherwise plain)
  let commentsRes = await supabase
    .from("route_comments")
    .select("*, profiles(username, avatar_url)")
    .eq("route_id", id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (commentsRes.error) {
    commentsRes = await supabase
      .from("route_comments")
      .select("*")
      .eq("route_id", id)
      .order("created_at", { ascending: false })
      .limit(100);
  }
  const comments = commentsRes.data ?? [];

  return (
    <main className="detail">
      <div className="wrap detail-wrap">
        <Link href="/rotalar" className="detail-back">← Rotalar</Link>

        <div className="detail-head">
          <div className="dh-left">
            <div className="dh-tags">
              <span className={`diff ${diff.className}`} style={{ position: "static" }}>{diff.label}</span>
              <span className="dh-type">
                <RouteTypeIcon type={route.route_type} width={15} height={15} />
                {ROUTE_TYPES[route.route_type as keyof typeof ROUTE_TYPES].label}
              </span>
            </div>
            <h1>{route.title}</h1>
            <div className="dh-sub">
              <span><PinIcon width={13} height={13} /> {route.province}</span>
              {author && (
                <Link href={`/profil/${author}`} className="dh-author">· @{author}</Link>
              )}
            </div>
          </div>
          <LikeSaveButtons
            routeId={route.id}
            liked={liked}
            saved={saved}
            likes={route.likes_count}
            saves={route.saves_count}
            isAuthed={!!user}
          />
        </div>

        <div className="readout">
          <div><span>Mesafe</span><b>{km(route.distance_m)} km</b></div>
          <div><span>İrtifa</span><b className="amber">↑ {route.elevation_gain_m.toLocaleString("tr-TR")} m</b></div>
          <div><span>Süre</span><b>{route.duration_min ? formatDuration(route.duration_min) : "—"}</b></div>
          <div><span>Beğeni</span><b>{route.likes_count}</b></div>
        </div>

        <RouteDetailMap coords={coords} color={diff.color} />

        <ElevationChart gpxUrl={route.gpx_url} />

        {route.gpx_url && (
          <a className="gpx-download" href={route.gpx_url} download>
            ↓ GPX dosyasını indir
          </a>
        )}

        {route.description && (
          <div className="detail-desc">
            <span className="eyebrow">Açıklama</span>
            <p>{route.description}</p>
          </div>
        )}

        <Comments
          routeId={route.id}
          initial={comments}
          isAuthed={!!user}
          currentUsername={(user?.user_metadata?.username as string) ?? null}
        />
      </div>
    </main>
  );
}
