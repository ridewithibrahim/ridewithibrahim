"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function JoinButton({
  eventId,
  initialJoined,
  initialCount,
  capacity,
  isAuthed,
}: {
  eventId: string;
  initialJoined: boolean;
  initialCount: number;
  capacity: number | null;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [joined, setJoined] = useState(initialJoined);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  const full = capacity != null && !joined && count >= capacity;

  async function toggle() {
    if (!isAuthed) {
      router.push(`/login?next=/bulusmalar/${eventId}`);
      return;
    }
    if (busy || full) return;
    setBusy(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/bulusmalar/${eventId}`);
      setBusy(false);
      return;
    }

    const next = !joined;
    setJoined(next);
    setCount((c) => Math.max(c + (next ? 1 : -1), 0));

    const { error } = next
      ? await supabase
          .from("event_attendees")
          .upsert(
            { event_id: eventId, user_id: user.id, status: "gidiyor" } as never,
            { onConflict: "event_id,user_id" },
          )
      : await supabase.from("event_attendees").delete().eq("event_id", eventId).eq("user_id", user.id);

    if (error) {
      setJoined(!next);
      setCount((c) => Math.max(c + (next ? -1 : 1), 0));
    } else {
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <button
      className={`btn ${joined ? "btn-ghost" : "btn-primary"}`}
      onClick={toggle}
      disabled={busy || full}
      aria-pressed={joined}
    >
      {full ? "Kontenjan dolu" : joined ? "Katılımdan çık" : "Katıl"}
    </button>
  );
}
