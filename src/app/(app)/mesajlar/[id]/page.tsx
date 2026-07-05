import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Chat, type ChatMessage } from "@/components/messages/chat";
import { ThreadActions } from "@/components/messages/thread-actions";

export const metadata = { title: "Sohbet — RideWithIbrahim" };

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/mesajlar/${id}`);

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, user_a, user_b")
    .eq("id", id)
    .maybeSingle<{ id: string; user_a: string; user_b: string }>();
  if (!conv || (conv.user_a !== user.id && conv.user_b !== user.id)) redirect("/mesajlar");

  const otherId = conv.user_a === user.id ? conv.user_b : conv.user_a;
  const { data: other } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", otherId)
    .maybeSingle<{ id: string; username: string | null; avatar_url: string | null }>();

  const { data: msgRows } = await supabase
    .from("messages")
    .select("id, sender_id, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })
    .limit(300)
    .returns<ChatMessage[]>();

  // benim engellediğim biri mi?
  const { data: myBlock } = await supabase
    .from("blocks")
    .select("blocked_id")
    .eq("blocked_id", otherId)
    .maybeSingle<{ blocked_id: string }>();

  // gelenleri okundu işaretle
  await supabase
    .from("messages")
    .update({ read: true } as never)
    .eq("conversation_id", id)
    .neq("sender_id", user.id)
    .eq("read", false);

  const username = other?.username ?? "kullanıcı";

  return (
    <main className="sec" style={{ paddingTop: 28 }}>
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div className="thread-head">
          <Link href="/mesajlar" className="btn btn-ghost btn-sm" aria-label="Mesajlara dön">←</Link>
          <Link href={`/profil/${username}`} className="thread-user">
            <span className="conv-avatar">
              {other?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={other.avatar_url} alt="" />
              ) : (
                username.charAt(0).toUpperCase()
              )}
            </span>
            <b>@{username}</b>
          </Link>
          <ThreadActions otherId={otherId} otherUsername={username} blockedByMe={!!myBlock} />
        </div>

        <Chat
          conversationId={id}
          meId={user.id}
          initial={msgRows ?? []}
          disabled={!!myBlock}
        />
      </div>
    </main>
  );
}
