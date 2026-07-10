"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { t, type Lang } from "@/lib/i18n";

export function CompleteButton({
  routeId,
  initialDone,
  initialCount,
  lang = "tr",
}: {
  routeId: string;
  initialDone: boolean;
  initialCount: number;
  lang?: Lang;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [done, setDone] = useState(initialDone);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=${pathname}`);
      setBusy(false);
      return;
    }

    const next = !done;
    setDone(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));

    const { error } = next
      ? await supabase
          .from("route_completions")
          .upsert(
            { route_id: routeId, user_id: user.id } as never,
            { onConflict: "user_id,route_id", ignoreDuplicates: true },
          )
      : await supabase.from("route_completions").delete().eq("route_id", routeId).eq("user_id", user.id);

    if (error) {
      setDone(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    }
    setBusy(false);
  }

  return (
    <span className="complete-wrap">
      <button
        type="button"
        className={`btn btn-sm ${done ? "btn-primary" : "btn-ghost"}`}
        onClick={toggle}
        disabled={busy}
        aria-pressed={done}
      >
        {done ? t(lang, "completed_state") : t(lang, "complete_btn")}
      </button>
      {count > 0 && (
        <span className="complete-count">
          🏁 {count} {t(lang, "riders_completed")}
        </span>
      )}
    </span>
  );
}
