import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ROUTE_TYPES } from "@/lib/types";
import { PinIcon, RouteTypeIcon } from "@/components/home/icons";
import { JoinButton } from "@/components/events/join-button";
import { ShareButton } from "@/components/routes/share-button";
import { DeleteEventButton } from "@/components/events/delete-event-button";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("title, province, location, starts_at")
    .eq("id", id)
    .maybeSingle<{ title: string; province: string; location: string; starts_at: string }>();

  if (!data) return { title: "Buluşma — RideWithIbrahim" };

  const when = new Date(data.starts_at).toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const desc = `${when} · ${data.location}, ${data.province}. RideWithIbrahim buluşması — sen de katıl!`;

  return {
    title: `${data.title} — RideWithIbrahim`,
    description: desc,
    openGraph: { title: data.title, description: desc },
  };
}

type EventShape = {
  id: string;
  host_id: string;
  route_id: string | null;
  title: string;
  description: string | null;
  event_type: keyof typeof ROUTE_TYPES;
  province: string;
  location: string;
  starts_at: string;
  capacity: number | null;
};

const AVATAR_COLORS = ["#F2B14C", "#5FB8A3", "#7FC2E0", "#54B97C", "#E2823F", "#D45D49"];

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: me } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle<{ is_admin: boolean }>();
    isAdmin = !!me?.is_admin;
  }

  const { data: row } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!row) notFound();
  const ev = row as unknown as EventShape;

  const { data: hostRow } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", ev.host_id)
    .maybeSingle<{ username: string | null }>();
  const host = hostRow?.username ?? undefined;

  const { data: att } = await supabase
    .from("event_attendees")
    .select("user_id")
    .eq("event_id", id)
    .eq("status", "gidiyor")
    .returns<{ user_id: string }[]>();
  const attendeeIds = (att ?? []).map((a) => a.user_id);
  const count = attendeeIds.length;
  const joined = user ? attendeeIds.includes(user.id) : false;

  let attendees: { id: string; username: string }[] = [];
  if (attendeeIds.length) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", attendeeIds)
      .returns<{ id: string; username: string }[]>();
    attendees = profs ?? [];
  }

  const dt = new Date(ev.starts_at);
  const dateStr = dt.toLocaleDateString("tr-TR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const timeStr = dt.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  return (
    <main className="detail">
      <div className="wrap detail-wrap">
        <Link href="/bulusmalar" className="detail-back">← Buluşmalar</Link>

        <div className="detail-head">
          <div className="dh-left">
            <div className="dh-tags">
              <span className="dh-type">
                <RouteTypeIcon type={ev.event_type} width={15} height={15} />
                {ROUTE_TYPES[ev.event_type].tag}
              </span>
            </div>
            <h1>{ev.title}</h1>
            <div className="dh-sub">
              <span><PinIcon width={13} height={13} /> {ev.location} · {ev.province}</span>
              {host && <Link href={`/profil/${host}`} className="dh-author">· @{host}</Link>}
            </div>
          </div>
          <JoinButton
            eventId={ev.id}
            initialJoined={joined}
            initialCount={count}
            capacity={ev.capacity}
            isAuthed={!!user}
          />
        </div>

        <div className="readout">
          <div><span>Tarih</span><b style={{ fontSize: 15 }}>{dateStr}</b></div>
          <div><span>Saat</span><b>{timeStr}</b></div>
          <div><span>Katılımcı</span><b className="amber">{count}{ev.capacity ? ` / ${ev.capacity}` : ""}</b></div>
        </div>

        <div className="detail-actions">
          <ShareButton
            title={ev.title}
            text={`${ev.title} — ${dateStr} · ${ev.location} 🚴 Sen de katıl!`}
          />
          {ev.route_id && (
            <Link className="gpx-download" href={`/rotalar/${ev.route_id}`}>→ İlişkili rotayı gör</Link>
          )}
          {(user?.id === ev.host_id || isAdmin) && (
            <span className="owner-actions">
              <DeleteEventButton eventId={ev.id} />
            </span>
          )}
        </div>

        {ev.description && (
          <div className="detail-desc">
            <span className="eyebrow">Açıklama</span>
            <p>{ev.description}</p>
          </div>
        )}

        <section className="comments">
          <h2 className="cm-title">Katılımcılar <span>{count}</span></h2>
          {attendees.length === 0 ? (
            <p className="cm-empty">Henüz katılan yok. İlk katılan sen ol!</p>
          ) : (
            <div className="attendee-list">
              {attendees.map((a, i) => (
                <Link key={a.id} href={`/profil/${a.username}`} className="attendee">
                  <span className="cm-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                    {a.username?.[0]?.toUpperCase() ?? "?"}
                  </span>
                  <b>@{a.username}</b>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
