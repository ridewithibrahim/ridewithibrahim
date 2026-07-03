"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { SaveIcon } from "@/components/home/icons";

export function SaveButton({
  routeId,
  initialSaved,
}: {
  routeId: string;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      setBusy(false);
      return;
    }

    const next = !saved;
    setSaved(next); // optimistic

    const { error } = next
      ? await supabase
          .from("route_saves")
          .upsert(
            { route_id: routeId, user_id: user.id } as never,
            { onConflict: "user_id,route_id", ignoreDuplicates: true },
          )
      : await supabase.from("route_saves").delete().eq("route_id", routeId).eq("user_id", user.id);

    if (error) setSaved(!next); // revert
    setBusy(false);
  }

  return (
    <button
      className={`save${saved ? " saved" : ""}`}
      aria-label={saved ? "Kaydedildi" : "Kaydet"}
      aria-pressed={saved}
      type="button"
      onClick={toggle}
      disabled={busy}
    >
      <SaveIcon width={15} height={15} />
    </button>
  );
}
