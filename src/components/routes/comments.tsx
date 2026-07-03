"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  author: string;
}

const AVATAR_COLORS = ["#F2B14C", "#5FB8A3", "#7FC2E0", "#54B97C", "#E2823F", "#D45D49"];

export function Comments({
  routeId,
  initial,
  isAuthed,
  currentUsername,
}: {
  routeId: string;
  initial: CommentItem[];
  isAuthed: boolean;
  currentUsername: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [items, setItems] = useState<CommentItem[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = text.trim();
    if (!content) return;
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

    const { data, error: err } = await supabase
      .from("route_comments")
      .insert({ route_id: routeId, user_id: user.id, content } as never)
      .select("id, content, created_at")
      .single();

    const row = data as { id: string; content: string; created_at: string } | null;
    if (err || !row) {
      setError(err?.message ?? "Yorum gönderilemedi.");
      setBusy(false);
      return;
    }

    setItems([
      {
        id: row.id,
        content: row.content,
        createdAt: row.created_at,
        author: currentUsername ?? "sen",
      },
      ...items,
    ]);
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
        {items.map((c, i) => (
          <div className="cm-item" key={c.id}>
            <span className="cm-avatar" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
              {c.author[0]?.toUpperCase()}
            </span>
            <div className="cm-body">
              <div className="cm-meta">
                <b>@{c.author}</b>
                <time>
                  {new Date(c.createdAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short" })}
                </time>
              </div>
              <p>{c.content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
