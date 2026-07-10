"use client";

import { useState } from "react";
import { type Lang } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function DeleteRouteButton({ routeId, lang = "tr" }: { routeId: string; lang?: Lang }) {
  const L = (tr: string, en: string) => (lang === "en" ? en : tr);
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
        {L("Rotayı sil", "Delete route")}
      </button>
    );
  }

  return (
    <span className="del-confirm">
      <span>{L("Emin misin?", "Are you sure?")}</span>
      <button type="button" className="btn-del solid" onClick={doDelete} disabled={busy}>
        {busy ? L("Siliniyor…", "Deleting…") : L("Evet, sil", "Yes, delete")}
      </button>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => setArming(false)} disabled={busy}>
        {L("Vazgeç", "Cancel")}
      </button>
      {err && <em className="field-error">{err}</em>}
    </span>
  );
}
