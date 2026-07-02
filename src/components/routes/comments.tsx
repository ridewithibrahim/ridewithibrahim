"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ⚠️ route_comments tablosundaki METİN sütununun adı buysa bırak.
// Farklıysa (ör. "body", "comment", "text") sadece burayı değiştir:
const TEXT_COLUMN = "content";

type CommentRow = Record<string, unknown> & {
  id: string;
  created_at?: string;
  profiles?: { username?: string; avatar_url?: string | null } | null;
  author?: string;
};

const AVATAR_COLORS = ["#F2B14C", "#5FB8A3", "#7FC2E0", "#54B97C", "#E2823F", "#D45D49"];

function textOf(c: CommentRow): string {
  return (
    (c[TEXT_COLUMN] as string) ??
    (c.content as string) ??
    (c.body as string) ??
    (c.comment as string) ??
    (c.text as string) ??
    ""
  );
}
function authorOf(c: CommentRow): string {
  return c.profiles?.username ?? c.author ?? "kullanıcı";
}

export function Comments({
  routeId,
  initial,
  isAuthed,
  currentUsername,
}: {
  routeId: string;
  initial: CommentRow[];
  isAuthed: boolean;
  currentUsername: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<CommentRow[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    if (!isAuthed) {
      router.push(`/login?next=/rotalar/${routeId}`);
      return;
    }
    setBusy(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setBusy(false);
      return;
    }

    const row: Record<string, unknown> = {
      route_id: routeId,
      user_id: user.id,
      [TEXT_COLUMN]: text.trim(),
    };

    const { data, error: err } = await supabase
      .from("route_comments")
      .insert(row)
      .select("*")
      .single();

    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }

    setItems([{ ...(data as CommentRow), author: currentUsername ?? "sen" }, ...items]);
    setText("");
    setBusy(false);
  }

  return (
    <section className="comments">
      <h2 className="cm-title">Yorumlar <span>{items.length}</span></h2>

      {isAuthed ? (
        <form className="cm-form" onSubmit={submit}>
          <textarea
            rows={3}
            placeholder="Bu rota hakkında ne düşünüyorsun?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
          />
          {error && <p className="field-error">{error}</p>}
          <div className="cm-form-foot">
            <button className="btn btn-primary btn-sm" type="submit" disabled={busy || !text.trim()}>
              {busy ? "Gönderiliyor…" : "Yorum yap"}
            </button>
          </div>
        </form>
      ) : (
        <p className="cm-signin">
          Yorum yapmak için <a href={`/login?next=/rotalar/${routeId}`}>giriş yap</a>.
        </p>
      )}

      <div className="cm-list">
        {items.length === 0 && <p className="cm-empty">İlk yorumu sen yaz.</p>}
        {items.map((c, i) => {
          const name = authorOf(c);
          return (
            <div className="cm-item" key={c.id ?? i}>
              <span className="cm-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                {name[0]?.toUpperCase()}
              </span>
              <div className="cm-body">
                <div className="cm-meta">
                  <b>@{name}</b>
                  {c.created_at && (
                    <time>{new Date(c.created_at).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}</time>
                  )}
                </div>
                <p>{textOf(c)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
