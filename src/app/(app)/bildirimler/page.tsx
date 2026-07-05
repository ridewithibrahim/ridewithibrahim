import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Bildirimler — RideWithIbrahim" };

type NotifRow = {
  id: string;
  actor_id: string;
  type: "like" | "comment" | "join";
  route_id: string | null;
  event_id: string | null;
  read: boolean;
  created_at: string;
};

const ICON: Record<NotifRow["type"], string> = { like: "❤️", comment: "💬", join: "🤝" };

function timeAgo(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "az önce";
  if (s < 3600) return `${Math.floor(s / 60)} dk önce`;
  if (s < 86400) return `${Math.floor(s / 3600)} sa önce`;
  if (s < 604800) return `${Math.floor(s / 86400)} gün önce`;
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bildirimler");

  const { data: rows } = await supabase
    .from("notifications")
    .select("id, actor_id, type, route_id, event_id, read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50)
    .returns<NotifRow[]>();

  const notifs = rows ?? [];

  // İsim ve başlıkları ayrı sorgularla zenginleştir (join yok — ev kuralı)
  const actorIds = [...new Set(notifs.map((n) => n.actor_id))];
  const routeIds = [...new Set(notifs.map((n) => n.route_id).filter(Boolean))] as string[];
  const eventIds = [...new Set(notifs.map((n) => n.event_id).filter(Boolean))] as string[];

  const [actorsRes, routesRes, eventsRes] = await Promise.all([
    actorIds.length
      ? supabase.from("profiles").select("id, username").in("id", actorIds).returns<{ id: string; username: string | null }[]>()
      : Promise.resolve({ data: [] as { id: string; username: string | null }[] }),
    routeIds.length
      ? supabase.from("routes").select("id, title").in("id", routeIds).returns<{ id: string; title: string }[]>()
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
    eventIds.length
      ? supabase.from("events").select("id, title").in("id", eventIds).returns<{ id: string; title: string }[]>()
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);

  const actors = new Map((actorsRes.data ?? []).map((a) => [a.id, a.username ?? "kullanıcı"]));
  const routeTitles = new Map((routesRes.data ?? []).map((r) => [r.id, r.title]));
  const eventTitles = new Map((eventsRes.data ?? []).map((e) => [e.id, e.title]));

  // Sayfa görüldü → hepsini okundu işaretle (liste bu render'da okunmamışları vurgulu gösterir)
  if (notifs.some((n) => !n.read)) {
    await supabase
      .from("notifications")
      .update({ read: true } as never)
      .eq("user_id", user.id)
      .eq("read", false);
  }

  return (
    <main className="sec" style={{ paddingTop: 40 }}>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div className="sec-head">
          <div>
            <span className="eyebrow">Neler olmuş?</span>
            <h2>Bildirimler</h2>
          </div>
        </div>

        {notifs.length === 0 ? (
          <div className="empty" style={{ padding: "60px 20px" }}>
            Henüz bildirimin yok.
            <br />
            Rotaların beğeni ve yorum aldığında burada görürsün.
          </div>
        ) : (
          <div className="notif-list">
            {notifs.map((n) => {
              const actor = actors.get(n.actor_id) ?? "kullanıcı";
              const href = n.route_id
                ? `/rotalar/${n.route_id}`
                : n.event_id
                  ? `/bulusmalar/${n.event_id}`
                  : "#";
              const target = n.route_id
                ? routeTitles.get(n.route_id) ?? "rotan"
                : eventTitles.get(n.event_id ?? "") ?? "buluşman";
              const text =
                n.type === "like" ? (
                  <>
                    <b>@{actor}</b>, <b>{target}</b> rotanı beğendi
                  </>
                ) : n.type === "comment" ? (
                  <>
                    <b>@{actor}</b>, <b>{target}</b> rotana yorum yaptı
                  </>
                ) : (
                  <>
                    <b>@{actor}</b>, <b>{target}</b> buluşmana katılıyor
                  </>
                );
              return (
                <Link key={n.id} href={href} className={`notif${n.read ? "" : " unread"}`}>
                  <span className="n-icon">{ICON[n.type]}</span>
                  <span className="n-text">{text}</span>
                  <span className="n-time">{timeAgo(n.created_at)}</span>
                  {!n.read && <span className="n-dot" aria-label="okunmadı" />}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
