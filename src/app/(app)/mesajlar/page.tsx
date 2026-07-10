import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n-server";
import { t as tt, type Lang } from "@/lib/i18n";
import { UnblockButton } from "@/components/messages/unblock-button";

export const metadata = { title: "Mesajlar — RideWithIbrahim" };

type Conv = {
  id: string;
  user_a: string;
  user_b: string;
  last_message_at: string;
  last_message_text: string | null;
};

function timeAgo(iso: string, lang: Lang) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return tt(lang, "just_now");
  if (s < 3600) return `${Math.floor(s / 60)} ${lang === "en" ? "m" : "dk"}`;
  if (s < 86400) return `${Math.floor(s / 3600)} ${lang === "en" ? "h" : "sa"}`;
  return new Date(iso).toLocaleDateString(lang === "en" ? "en-GB" : "tr-TR", { day: "numeric", month: "short" });
}

export default async function MessagesPage() {
  const lang = await getLang();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/mesajlar");

  const { data: convRows } = await supabase
    .from("conversations")
    .select("id, user_a, user_b, last_message_at, last_message_text")
    .order("last_message_at", { ascending: false })
    .limit(50)
    .returns<Conv[]>();
  const convs = convRows ?? [];

  const otherIds = [...new Set(convs.map((c) => (c.user_a === user.id ? c.user_b : c.user_a)))];
  const { data: profs } = otherIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .in("id", otherIds)
        .returns<{ id: string; username: string | null; avatar_url: string | null }[]>()
    : { data: [] as { id: string; username: string | null; avatar_url: string | null }[] };
  const people = new Map((profs ?? []).map((p) => [p.id, p]));

  // okunmamışlar (RLS zaten benim konuşmalarıma kısıtlar)
  const { data: unreadRows } = await supabase
    .from("messages")
    .select("conversation_id")
    .eq("read", false)
    .neq("sender_id", user.id)
    .returns<{ conversation_id: string }[]>();
  const unread = new Map<string, number>();
  for (const r of unreadRows ?? []) unread.set(r.conversation_id, (unread.get(r.conversation_id) ?? 0) + 1);

  // engellediklerim
  const { data: blockRows } = await supabase
    .from("blocks")
    .select("blocked_id")
    .returns<{ blocked_id: string }[]>();
  const blockedIds = (blockRows ?? []).map((b) => b.blocked_id);
  const { data: blockedProfs } = blockedIds.length
    ? await supabase
        .from("profiles")
        .select("id, username")
        .in("id", blockedIds)
        .returns<{ id: string; username: string | null }[]>()
    : { data: [] as { id: string; username: string | null }[] };

  return (
    <main className="sec" style={{ paddingTop: 40 }}>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div className="sec-head">
          <div>
            <span className="eyebrow">{tt(lang, "f_community")}</span>
            <h2>{tt(lang, "messages")}</h2>
          </div>
        </div>

        {convs.length === 0 ? (
          <div className="empty" style={{ padding: "60px 20px" }}>
            {tt(lang, "msgs_empty1")}
            <br />
            {tt(lang, "msgs_empty2")}
          </div>
        ) : (
          <div className="notif-list">
            {convs.map((c) => {
              const otherId = c.user_a === user.id ? c.user_b : c.user_a;
              const p = people.get(otherId);
              const n = unread.get(c.id) ?? 0;
              return (
                <Link key={c.id} href={`/mesajlar/${c.id}`} className={`notif conv${n ? " unread" : ""}`}>
                  <span className="conv-avatar">
                    {p?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" />
                    ) : (
                      (p?.username ?? "?").charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="n-text">
                    <b>@{p?.username ?? "kullanıcı"}</b>
                    <span className="conv-preview">{c.last_message_text ?? tt(lang, "start_chat")}</span>
                  </span>
                  <span className="n-time">{timeAgo(c.last_message_at, lang)}</span>
                  {n > 0 && <span className="bell-badge conv-badge">{n > 9 ? "9+" : n}</span>}
                </Link>
              );
            })}
          </div>
        )}

        {(blockedProfs ?? []).length > 0 && (
          <div className="blocked-box">
            <span className="eyebrow">{tt(lang, "blocked_h")}</span>
            {(blockedProfs ?? []).map((b) => (
              <div key={b.id} className="blocked-row">
                <span>@{b.username ?? "kullanıcı"}</span>
                <UnblockButton blockedId={b.id} lang={lang} />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
