"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { t, type Lang } from "@/lib/i18n";

export function UnblockButton({ blockedId, lang = "tr" }: { blockedId: string; lang?: Lang }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function unblock() {
    setBusy(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("blocks").delete().eq("blocker_id", user.id).eq("blocked_id", blockedId);
    router.refresh();
  }

  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={unblock} disabled={busy}>
      {busy ? "…" : t(lang, "unblock")}
    </button>
  );
}
