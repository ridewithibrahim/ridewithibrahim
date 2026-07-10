import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n-server";
import { slugifyProvince } from "@/lib/slug";
import { t as tr, diffName, typeName } from "@/lib/i18n";
import { DIFFICULTY, km, formatDuration } from "@/lib/types";
import type { RouteType, Difficulty } from "@/lib/types";
import { RouteTypeIcon, PinIcon } from "@/components/home/icons";
import { RouteDetailMap } from "@/components/routes/route-detail-map";
import { ElevationChart } from "@/components/routes/elevation-chart";
import { LikeSaveButtons } from "@/components/routes/like-save-buttons";
import { CompleteButton } from "@/components/routes/complete-button";
import { ShareButton } from "@/components/routes/share-button";
import { StoryCardButton } from "@/components/routes/story-card-button";
import { DeleteRouteButton } from "@/components/routes/delete-route-button";
import { Comments } from "@/components/routes/comments";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("routes")
    .select("title, province, distance_m, elevation_gain_m, thumbnail_url")
    .eq("id", id)
    .maybeSingle<{
      title: string;
      province: string;
      distance_m: number;
      elevation_gain_m: number;
      thumbnail_url: string | null;
    }>();

  if (!data) return { title: "Rota — RideWithIbrahim" };

  const desc = `${data.province} · ${km(data.distance_m)} km · ↑ ${data.elevation_gain_m.toLocaleString(
    "tr-TR",
  )} m tırmanış. RideWithIbrahim'de keşfet.`;

  return {
    title: `${data.title} — RideWithIbrahim`,
    description: desc,
    openGraph: {
      title: data.title,
      description: desc,
      ...(data.thumbnail_url ? { images: [{ url: data.thumbnail_url }] } : {}),
    },
  };
}

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
  thumbnail_url: string | null;
  likes_count: number;
  saves_count: number;
};

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lang = await getLang();
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
      .maybeSingle<{ username: string | null }>();
    author = prof?.username ?? undefined;
  }

  // moderasyon: mevcut kullanıcı admin mi?
  let isAdmin = false;
  if (user) {
    const { data: me } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle<{ is_admin: boolean }>();
    isAdmin = !!me?.is_admin;
  }
  const isOwner = user?.id === route.user_id;

  // tamamlama: sayı + benim durumum
  const { count: doneCount } = await supabase
    .from("route_completions")
    .select("id", { count: "exact", head: true })
    .eq("route_id", route.id);
  let myDone = false;
  if (user) {
    const { data: dc } = await supabase
      .from("route_completions")
      .select("id")
      .eq("route_id", route.id)
      .eq("user_id", user.id)
      .maybeSingle<{ id: string }>();
    myDone = !!dc;
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

  // comments (no-join pattern: fetch rows, then author usernames)
  type CommentRowDb = { id: string; content: string; created_at: string; user_id: string };
  type ProfileMini = { id: string; username: string };

  const { data: rawComments } = await supabase
    .from("route_comments")
    .select("id, content, created_at, user_id")
    .eq("route_id", id)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<CommentRowDb[]>();
  const cRows: CommentRowDb[] = rawComments ?? [];

  let commentAuthors = new Map<string, string>();
  if (cRows.length) {
    const uids = [...new Set(cRows.map((c) => c.user_id))];
    const { data: cp } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", uids)
      .returns<ProfileMini[]>();
    commentAuthors = new Map((cp ?? []).map((p) => [p.id, p.username]));
  }
  const comments = cRows.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.created_at,
    author: commentAuthors.get(c.user_id) ?? "kullanıcı",
    userId: c.user_id,
  }));

  return (
    <main className="detail">
      <div className="wrap detail-wrap">
        <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristTrip",
            name: route.title,
            description:
              route.description ??
              `${route.province} bölgesinde ${km(route.distance_m)} km'lik rota — RideWithIbrahim topluluk rotası.`,
            touristType: "Cyclists",
            itinerary: { "@type": "Place", name: route.province },
          }),
        }}
      />
      <Link href="/rotalar" className="detail-back">← {tr(lang, "nav_routes")}</Link>

        <div className="detail-head">
          <div className="dh-left">
            <div className="dh-tags">
              <span className={`diff ${diff.className}`} style={{ position: "static" }}>{diffName(lang, route.difficulty)}</span>
              <span className="dh-type">
                <RouteTypeIcon type={route.route_type} width={15} height={15} />
                {typeName(lang, route.route_type as "yol" | "mtb" | "moto" | "kamp")}
              </span>
            </div>
            <h1>{route.title}</h1>
            <div className="dh-sub">
              <span><PinIcon width={13} height={13} /> <Link href={`/rotalar/il/${slugifyProvince(route.province)}`} className="prov-link">{route.province}</Link></span>
              {author && (
                <Link href={`/profil/${author}`} className="dh-author">· @{author}</Link>
              )}
            </div>
          </div>
          <LikeSaveButtons
            lang={lang}
            routeId={route.id}
            liked={liked}
            saved={saved}
            likes={route.likes_count}
            saves={route.saves_count}
            isAuthed={!!user}
          />
          <CompleteButton
            routeId={route.id}
            initialDone={myDone}
            initialCount={doneCount ?? 0}
            lang={lang}
          />
        </div>

        <div className="readout">
          <div><span>{tr(lang, "distance")}</span><b>{km(route.distance_m)} km</b></div>
          <div><span>{tr(lang, "elevation")}</span><b className="amber">↑ {route.elevation_gain_m.toLocaleString("tr-TR")} m</b></div>
          <div><span>{tr(lang, "duration")}</span><b>{route.duration_min ? formatDuration(route.duration_min) : "—"}</b></div>
          <div><span>{tr(lang, "likes_word")}</span><b>{route.likes_count}</b></div>
        </div>

        {route.thumbnail_url && (
          <div className="detail-photo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={route.thumbnail_url} alt={route.title} />
          </div>
        )}

        <RouteDetailMap coords={coords} color={diff.color} />

        <ElevationChart gpxUrl={route.gpx_url} />

        <div className="detail-actions">
          {coords.length > 0 && (
            <a
              className="btn btn-primary btn-sm"
              href={`https://www.google.com/maps/dir/?api=1&destination=${coords[0][1]},${coords[0][0]}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L4.5 20.3a.5.5 0 00.65.65L12 18l6.85 2.95a.5.5 0 00.65-.65L12 2z" />
              </svg>
              {tr(lang, "nav_to_start")}
            </a>
          )}
          <ShareButton
            lang={lang}
            title={route.title}
            text={`${route.title} — ${route.province} · ${km(route.distance_m)} km 🚴`}
          />
          <StoryCardButton
            lang={lang}
            title={route.title}
            province={route.province}
            stats={`${km(route.distance_m)} km  ·  ↑ ${route.elevation_gain_m.toLocaleString("tr-TR")} m  ·  ${formatDuration(route.duration_min)}`}
            diffLabel={diffName(lang, route.difficulty)}
            diffColor={diff.color}
            coords={coords as [number, number][]}
            photoUrl={route.thumbnail_url}
          />
          {route.gpx_url && (
            <a className="gpx-download" href={route.gpx_url} download>
              {tr(lang, "gpx_dl")}
            </a>
          )}
          {(isOwner || isAdmin) && (
            <span className="owner-actions">
              {isOwner && (
                <Link className="btn btn-ghost btn-sm" href={`/rotalar/${route.id}/duzenle`}>{tr(lang, "edit")}</Link>
              )}
              <DeleteRouteButton routeId={route.id} lang={lang} />
            </span>
          )}
        </div>

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
          currentUserId={user?.id ?? null}
          isModerator={isAdmin}
          lang={lang}
          currentUsername={(user?.user_metadata?.username as string) ?? null}
        />
      </div>
    </main>
  );
}
