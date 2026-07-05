"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HeartIcon } from "@/components/home/icons";

export function CardLike({
  routeId,
  initialLiked,
  initialCount,
}: {
  routeId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [busy, setBusy] = useState(false);

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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

    const next = !liked;
    setLiked(next);
    setCount((c) => Math.max(0, c + (next ? 1 : -1)));

    const { error } = next
      ? await supabase
          .from("route_likes")
          .upsert(
            { route_id: routeId, user_id: user.id } as never,
            { onConflict: "user_id,route_id", ignoreDuplicates: true },
          )
      : await supabase.from("route_likes").delete().eq("route_id", routeId).eq("user_id", user.id);

    if (error) {
      setLiked(!next);
      setCount((c) => Math.max(0, c + (next ? -1 : 1)));
    }
    setBusy(false);
  }

  return (
    <button
      type="button"
      className={`likes card-like${liked ? " on" : ""}`}
      onClick={toggle}
      disabled={busy}
      aria-pressed={liked}
      aria-label={liked ? "Beğenmekten vazgeç" : "Beğen"}
    >
      <HeartIcon width={16} height={16} />
      <span>{count}</span>
    </button>
  );
}
