"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function MessageButton({ otherId }: { otherId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function start() {
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login?next=/mesajlar");
      return;
    }
    const { data, error } = await supabase.rpc("get_or_create_conversation", { p_other: otherId } as never);
    if (error || !data) {
      const msg = error?.message ?? "";
      if (msg.includes("engellen")) setErr("Bu kişiyle mesajlaşma engellenmiş.");
      else if (msg.toLowerCase().includes("function") || msg.includes("schema cache"))
        setErr("Mesajlaşma altyapısı kurulu değil (0011 SQL'i çalıştırılmalı).");
      else setErr(msg || "Sohbet başlatılamadı.");
      setBusy(false);
      return;
    }
    router.push(`/mesajlar/${data as string}`);
  }

  return (
    <span className="msg-btn-wrap">
      <button type="button" className="btn btn-primary btn-sm msg-btn" onClick={start} disabled={busy}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.4 8.4 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.4 8.4 0 01-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.4 8.4 0 013.8-.9h.5a8.5 8.5 0 018 8v.5z" />
        </svg>
        Mesaj gönder
      </button>
      {err && <em className="field-error">{err}</em>}
    </span>
  );
}
