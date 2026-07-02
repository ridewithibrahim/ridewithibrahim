import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { km } from "@/lib/types";

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
            <span className="eyebrow">Liderlik tablosu</span>
            <h2>{allTime ? "Tüm zamanlar" : "Bu haftanın liderleri"}</h2>
          </div>
        </div>

        <div className="lb-tabs">
          <Link href="/liderlik" className={`chip${!allTime ? " active" : ""}`}>
            Bu hafta
          </Link>
          <Link href="/liderlik?donem=tum" className={`chip${allTime ? " active" : ""}`}>
            Tüm zamanlar
          </Link>
        </div>

        {rows.length === 0 ? (
          <div className="empty" style={{ padding: "60px 20px" }}>
            {allTime
              ? "Henüz rota paylaşan yok."
              : "Bu hafta henüz rota paylaşılmadı."}
            <br />
            <Link href="/rotalar/yeni" style={{ color: "var(--amber)", fontWeight: 600 }}>
              İlk sırayı kap →
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
                </Link>
                <div className="lb-stats mono">
                  <span><b>{r.route_count}</b> rota</span>
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
