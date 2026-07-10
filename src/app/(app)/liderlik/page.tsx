import Link from "next/link";
import { getLang } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { km } from "@/lib/types";
import { getRank, rankName } from "@/lib/badges";

export const metadata = {
  title: "Liderlik — RideWithIbrahim",
  description: "Bu haftanın ve tüm zamanların en aktif rota paylaşımcıları.",
};

type LeaderRow = {
  id: string;
  username: string;
  avatar_url: string | null;
  route_count: number;
  total_distance_m: number;
  total_likes?: number;
};

const AVATAR_COLORS = ["#F2B14C", "#5FB8A3", "#7FC2E0", "#54B97C", "#E2823F", "#D45D49", "#5BA3D0"];
const MEDALS = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ donem?: string }>;
}) {
  const lang = await getLang();
  const sp = await searchParams;
  const allTime = sp.donem === "tum";
  const supabase = await createClient();

  const { data } = await supabase
    .from(allTime ? "alltime_leaderboard" : "weekly_leaderboard")
    .select("*")
    .limit(50);
  const rows = (data ?? []) as LeaderRow[];

  return (
    <main className="sec" style={{ paddingTop: 40 }}>
      <div className="wrap" style={{ maxWidth: 760 }}>
        <div className="sec-head">
          <div>
            <span className="eyebrow">{t(lang, "lb_eyebrow")}</span>
            <h2>{allTime ? t(lang, "lb_alltime") : t(lang, "lb_week_title")}</h2>
          </div>
        </div>

        <div className="lb-tabs">
          <Link href="/liderlik" className={`chip${!allTime ? " active" : ""}`}>
            {t(lang, "lb_week_tab")}
          </Link>
          <Link href="/liderlik?donem=tum" className={`chip${allTime ? " active" : ""}`}>
            {t(lang, "lb_alltime")}
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="empty" style={{ padding: "60px 20px" }}>
            {allTime
              ? t(lang, "lb_empty_all")
              : t(lang, "lb_empty_week")}
            <br />
            <Link href="/rotalar/yeni" style={{ color: "var(--amber)", fontWeight: 600 }}>
              {t(lang, "lb_claim")}
            </Link>
          </div>
        ) : (
          <ol className="lb-list">
            {rows.map((r, i) => (
              <li key={r.id} className={`lb-row${i < 3 ? ` top t${i + 1}` : ""}`}>
                <span className="lb-rank mono">{i < 3 ? MEDALS[i] : i + 1}</span>
                <Link href={`/profil/${r.username}`} className="lb-user">
                  <span
                    className="cm-avatar"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {r.username?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  <b>@{r.username}</b>
                  <span
                    className="lb-rankbadge"
                    title={rankName(getRank(r.route_count, Number(r.total_distance_m) / 1000), lang)}
                  >
                    {getRank(r.route_count, Number(r.total_distance_m) / 1000).emoji}
                  </span>
                </Link>
                <div className="lb-stats mono">
                  <span><b>{r.route_count}</b> {t(lang, "routes_word")}</span>
                  <span><b>{km(r.total_distance_m)}</b> km</span>
                  {typeof r.total_likes === "number" && (
                    <span><b>{r.total_likes.toLocaleString("tr-TR")}</b> ♥</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}

        <p className="lb-note">
          Sıralama {allTime ? "toplam" : "son 7 gündeki"} rota sayısına, eşitlikte toplam mesafeye göredir.
        </p>
      </div>
    </main>
  );
}
