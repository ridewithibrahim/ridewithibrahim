import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRoutes } from "@/lib/queries";
import { RouteCard } from "@/components/home/route-card";
import { km } from "@/lib/types";
import { PlusIcon } from "@/components/home/icons";
import { getRank, getNextRank, computeBadges, rankName } from "@/lib/badges";
import { getLang } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { MessageButton } from "@/components/messages/message-button";

type ProfileShape = {
  id: string;
  username: string;
  avatar_url?: string | null;
  full_name?: string | null;
  city?: string | null;
  created_at?: string | null;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  return { title: `@${username} — RideWithIbrahim` };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const lang = await getLang();
  const supabase = await createClient();

  const { data: profileRow } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (!profileRow) notFound();
  const profile = profileRow as unknown as ProfileShape;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isOwn = (user?.user_metadata?.username as string | undefined) === username;

  const routes = await getUserRoutes(profile.id);
  const totalRoutes = routes.length;
  const totalDistance = routes.reduce((s, r) => s + r.distanceM, 0);
  const totalLikes = routes.reduce((s, r) => s + r.likesCount, 0);

  const totalKm = totalDistance / 1000;
  const rank = getRank(totalRoutes, totalKm);
  // tamamlama istatistikleri
  const { data: compRows } = await supabase
    .from("route_completions")
    .select("route_id")
    .eq("user_id", profile.id)
    .returns<{ route_id: string }[]>();
  const compIds = (compRows ?? []).map((c) => c.route_id);
  let riddenKm = 0;
  if (compIds.length) {
    const { data: compRoutes } = await supabase
      .from("routes")
      .select("distance_m")
      .in("id", compIds)
      .returns<{ distance_m: number }[]>();
    riddenKm = Math.round(((compRoutes ?? []).reduce((s, r) => s + r.distance_m, 0)) / 1000);
  }

  const badges = computeBadges(routes);
  const next = getNextRank(totalRoutes, totalKm);

  const joined = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("tr-TR", { month: "long", year: "numeric" })
    : null;

  return (
    <main className="profile">
      <div className="wrap" style={{ maxWidth: 960 }}>
        <header className="pf-head">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="pf-avatar-img" />
          ) : (
            <span className="pf-avatar">{username[0]?.toUpperCase() ?? "?"}</span>
          )}
          <div className="pf-id">
            <h1>@{username}</h1>
            <span className="rank-chip" title={`${totalRoutes} rota · ${Math.round(totalKm)} km`}>
              {rank.emoji} {rankName(rank, lang)}
            </span>
            {profile.full_name && <p className="pf-name">{profile.full_name}</p>}
            <div className="pf-meta">
              {profile.city && <span>{profile.city}</span>}
              {joined && <span>{lang === "en" ? `Member since ${joined}` : `${joined}\u2019den beri üye`}</span>}
            </div>
          </div>
          {!isOwn && user && (
            <div className="pf-actions">
              <MessageButton otherId={profile.id} lang={lang} />
            </div>
          )}
          {isOwn && (
            <div className="pf-actions">
              <Link className="btn btn-ghost btn-sm" href="/kaydedilenler">{t(lang, "saved")}</Link>
              <Link className="btn btn-ghost btn-sm" href="/ayarlar">{t(lang, "settings")}</Link>
              <Link className="btn btn-primary btn-sm" href="/rotalar/yeni">
                <PlusIcon width={16} height={16} /> {t(lang, "cta_share")}
              </Link>
            </div>
          )}
        </header>

        {isOwn && next && (
          <p className="rank-next">
            {lang === "en" ? (
              <>Next rank: {next.rank.emoji} <b>{rankName(next.rank, lang)}</b> — {next.needRoutes} more routes or {next.needKm} km to go.</>
            ) : (
              <>Sıradaki rütbe: {next.rank.emoji} <b>{next.rank.name}</b> — {next.needRoutes} rota ya da {next.needKm} km kaldı.</>
            )}
          </p>
        )}

        <div className="pf-stats">
          <div><b>{totalRoutes}</b><span>{t(lang, "stat_routes")}</span></div>
          <div><b>{km(totalDistance)}</b><span>{t(lang, "stat_km")}</span></div>
          <div><b>{totalLikes.toLocaleString("tr-TR")}</b><span>{t(lang, "total_likes")}</span></div>
          <div><b>{compIds.length}</b><span>🏁 {t(lang, "stat_completed")}</span></div>
          <div><b>{riddenKm.toLocaleString("tr-TR")}</b><span>{t(lang, "stat_ridden")}</span></div>
        </div>

        <div className="pf-badges">
          {badges.map((b) => (
            <div key={b.id} className={`badge${b.earned ? " earned" : ""}`} title={lang === "en" ? b.descEn : b.desc}>
              <span className="b-emoji">{b.earned ? b.emoji : "🔒"}</span>
              <span className="b-label">{lang === "en" ? b.labelEn : b.label}</span>
            </div>
          ))}
        </div>

        <div className="sec-head" style={{ marginTop: 36, marginBottom: 20 }}>
          <div>
            <span className="eyebrow">{t(lang, "shared_routes")}</span>
            <h2>{totalRoutes} {t(lang, "routes_word")}</h2>
          </div>
        </div>

        {routes.length === 0 ? (
          <div className="empty" style={{ padding: "60px 20px" }}>
            {isOwn ? (
              <>
                {t(lang, "no_routes_own")}
                <br />
                <Link href="/rotalar/yeni" style={{ color: "var(--amber)", fontWeight: 600 }}>
                  İlk rotanı paylaş →
                </Link>
              </>
            ) : (
              <>{lang === "en" ? <>@{username} hasn&apos;t shared any routes yet.</> : <>@{username} henüz rota paylaşmamış.</>}</>
            )}
          </div>
        ) : (
          <div className="route-grid">
            {routes.map((r) => (
              <RouteCard key={r.id} route={r} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
