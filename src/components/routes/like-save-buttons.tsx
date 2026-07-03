"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { HeartIcon, SaveIcon } from "@/components/home/icons";

export function LikeSaveButtons({
  routeId,
  liked: initLiked,
  saved: initSaved,
  likes: initLikes,
  isAuthed,
}: {
  routeId: string;
  liked: boolean;
  saved: boolean;
  likes: number;
  saves?: number;
  isAuthed: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [liked, setLiked] = useState(initLiked);
  const [saved, setSaved] = useState(initSaved);
  const [likes, setLikes] = useState(initLikes);
  const [pending, setPending] = useState({ like: false, save: false });
  const [err, setErr] = useState("");

  // Beğeni sayısını gerçek satır sayısından oku (trigger'a bağımlı değil).
  async function refreshLikeCount() {
    const { count } = await supabase
      .from("route_likes")
      .select("*", { count: "exact", head: true })
      .eq("route_id", routeId);
    if (typeof count === "number") setLikes(count);
  }

  async function toggle(kind: "like" | "save") {
    if (!isAuthed) {
      router.push(`/login?next=/rotalar/${routeId}`);
      return;
    }
    if (pending[kind]) return;

    setErr("");
    setPending((p) => ({ ...p, [kind]: true }));

    const table = kind === "like" ? "route_likes" : "route_saves";
    const wasOn = kind === "like" ? liked : saved;
    const nextOn = !wasOn;

    // 1) optimistic — anında değişsin
    if (kind === "like") {
      setLiked(nextOn);
      setLikes((n) => Math.max(n + (nextOn ? 1 : -1), 0));
    } else {
      setSaved(nextOn);
    }

    // 2) gerçek DB işlemi
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/rotalar/${routeId}`);
      setPending((p) => ({ ...p, [kind]: false }));
      return;
    }

    const { error } = nextOn
      ? await supabase
          .from(table)
          .upsert(
            { route_id: routeId, user_id: user.id } as never,
            { onConflict: "user_id,route_id", ignoreDuplicates: true },
          )
      : await supabase.from(table).delete().eq("route_id", routeId).eq("user_id", user.id);

    // 3) hata olursa geri al + göster
    if (error) {
      if (kind === "like") {
        setLiked(wasOn);
        setLikes((n) => Math.max(n + (nextOn ? -1 : 1), 0));
      } else {
        setSaved(wasOn);
      }
      setErr(error.message);
    } else if (kind === "like") {
      refreshLikeCount(); // sayıyı DB gerçeğiyle eşitle
    }

    setPending((p) => ({ ...p, [kind]: false }));
  }

  return (
    <div className="ls-wrap">
      <div className="ls-actions">
        <button
          className={`ls-btn${liked ? " on" : ""}`}
          onClick={() => toggle("like")}
          disabled={pending.like}
          aria-pressed={liked}
        >
          <HeartIcon width={17} height={17} />
          <span>{likes}</span>
        </button>
        <button
          className={`ls-btn ls-save${saved ? " on" : ""}`}
          onClick={() => toggle("save")}
          disabled={pending.save}
          aria-pressed={saved}
        >
          <SaveIcon width={16} height={16} />
          <span>{saved ? "Kaydedildi" : "Kaydet"}</span>
        </button>
      </div>
      {err && <p className="ls-err">İşlem başarısız: {err}</p>}
    </div>
  );
}
