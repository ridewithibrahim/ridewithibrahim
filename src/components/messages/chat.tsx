"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

export function Chat({
  conversationId,
  meId,
  initial,
  disabled = false,
}: {
  conversationId: string;
  meId: string;
  initial: ChatMessage[];
  disabled?: boolean;
}) {
  const [msgs, setMsgs] = useState<ChatMessage[]>(initial);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastTsRef = useRef(initial.length ? initial[initial.length - 1].created_at : "1970-01-01");

  // yeni mesaj geldikçe en alta kay
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [msgs.length]);

  // 5 sn'de bir yeni mesajları çek
  useEffect(() => {
    const supabase = createClient();
    const t = setInterval(async () => {
      const { data } = await supabase
        .from("messages")
        .select("id, sender_id, content, created_at")
        .eq("conversation_id", conversationId)
        .gt("created_at", lastTsRef.current)
        .order("created_at", { ascending: true })
        .returns<ChatMessage[]>();
      if (data?.length) {
        setMsgs((cur) => {
          const known = new Set(cur.map((m) => m.id));
          const fresh = data.filter((m) => !known.has(m.id));
          return fresh.length ? [...cur, ...fresh] : cur;
        });
        lastTsRef.current = data[data.length - 1].created_at;
        // gelenleri okundu say
        void supabase
          .from("messages")
          .update({ read: true } as never)
          .eq("conversation_id", conversationId)
          .neq("sender_id", meId)
          .eq("read", false);
      }
    }, 5000);
    return () => clearInterval(t);
  }, [conversationId, meId]);

  async function send() {
    const content = text.trim();
    if (!content || sending || disabled) return;
    setSending(true);
    setErr("");

    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ conversation_id: conversationId, sender_id: meId, content } as never)
      .select("id, sender_id, content, created_at")
      .single<ChatMessage>();

    if (error || !data) {
      setErr("Mesaj gönderilemedi — engellenmiş olabilirsin ya da bağlantı koptu.");
    } else {
      setMsgs((cur) => [...cur, data]);
      lastTsRef.current = data.created_at;
      setText("");
    }
    setSending(false);
  }

  return (
    <div className="chat">
      <div className="chat-scroll">
        {msgs.length === 0 && (
          <div className="empty" style={{ padding: "40px 16px" }}>
            İlk mesajı yaz, sohbeti başlat. 👋
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`bubble${m.sender_id === meId ? " mine" : ""}`}>
            <p>{m.content}</p>
            <time>
              {new Date(m.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
            </time>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {disabled ? (
        <p className="chat-blocked">Bu kişiyi engelledin — mesaj gönderilemez. Engeli Mesajlar sayfasından kaldırabilirsin.</p>
      ) : (
        <div className="chat-input">
          <textarea
            rows={1}
            placeholder="Mesaj yaz…"
            value={text}
            maxLength={2000}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button type="button" className="btn btn-primary btn-sm" onClick={send} disabled={sending || !text.trim()}>
            {sending ? "…" : "Gönder"}
          </button>
        </div>
      )}
      {err && <p className="ls-err">{err}</p>}
    </div>
  );
}
