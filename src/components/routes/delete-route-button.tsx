"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteRouteButton({ routeId }: { routeId: string }) {
  const router = useRouter();
  const [arming, setArming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function doDelete() {
    setBusy(true);
    setErr("");
    const supabase = createClient();
    const { error } = await supabase.from("routes").delete().eq("id", routeId);
    if (error) {
      setErr(error.message);
      setBusy(false);
      return;
    }
    router.push("/rotalar");
    router.refresh();
  }

  if (!arming) {
    return (
      <button type="button" className="btn-del" onClick={() => setArming(true)}>
        Rotayı sil
      </button>
    );
  }

  return (
    <span className="del-confirm">
      <span>Emin misin?</span>
      <button type="button" className="btn-del solid" onClick={doDelete} disabled={busy}>
        {busy ? "Siliniyor…" : "Evet, sil"}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArming(false)} disabled={busy}>
        Vazgeç
      </button>
      {err && <em className="field-error">{err}</em>}
    </span>
  );
}
