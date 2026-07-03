"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [arming, setArming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function doDelete() {
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    router.push("/bulusmalar");
    router.refresh();
  }

  if (!arming) {
    return (
      <button type="button" className="btn-del" onClick={() => setArming(true)}>
        Buluşmayı iptal et
      </button>
    );
  }

  return (
    <span className="del-confirm">
      <span>Emin misin?</span>
      <button type="button" className="btn-del solid" onClick={doDelete} disabled={busy}>
        {busy ? "İptal ediliyor…" : "Evet, iptal et"}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArming(false)} disabled={busy}>
        Vazgeç
      </button>
      {err && <em className="field-error">{err}</em>}
    </span>
  );
}
