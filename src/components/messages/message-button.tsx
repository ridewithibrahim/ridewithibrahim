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
      setErr(error?.message?.includes("engellen") ? "Bu kişiyle mesajlaşma engellenmiş." : "Sohbet başlatılamadı.");
      setBusy(false);
      return;
    }
    router.push(`/mesajlar/${data as string}`);
  }

  return (
    <span className="msg-btn-wrap">
      <button type="button" className="btn btn-primary btn-sm" onClick={start} disabled={busy}>
        {busy ? "Açılıyor…" : "💬 Mesaj gönder"}
      </button>
      {err && <em className="field-error">{err}</em>}
    </span>
  );
}
