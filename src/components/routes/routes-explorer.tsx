"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { RouteCard } from "@/components/home/route-card";
import { ROUTE_TYPES, DIFFICULTY } from "@/lib/types";
import type { RouteSummary, RouteType, Difficulty } from "@/lib/types";

const TYPES: RouteType[] = ["yol", "mtb", "moto", "kamp"];
const DIFFS: Difficulty[] = ["kolay", "orta", "zor", "uzman"];
const DISTANCES: { key: string; label: string; min: number; max: number | null }[] = [
  { key: "0-25", label: "0–25 km", min: 0, max: 25000 },
  { key: "25-50", label: "25–50 km", min: 25000, max: 50000 },
  { key: "50-100", label: "50–100 km", min: 50000, max: 100000 },
  { key: "100+", label: "100+ km", min: 100000, max: null },
];

type Row = {
  id: string;
  user_id: string;
  title: string;
  province: string;
  route_type: RouteType;
  difficulty: Difficulty;
  distance_m: number;
  elevation_gain_m: number;
  duration_min: number;
  likes_count: number;
  thumbnail_url: string | null;
};

export function RoutesExplorer() {
  const [all, setAll] = useState<RouteSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [type, setType] = useState<"all" | RouteType>("all");
  const [diff, setDiff] = useState<"all" | Difficulty>("all");
  const [distance, setDistance] = useState<string | null>(null);
  const [province, setProvince] = useState("");

  useEffect(() => {
    let ok = true;
    (async () => {
      const supabase = createClient();
      const { data, error: err } = await supabase
        .from("routes")
        .select(
          "id, user_id, title, province, route_type, difficulty, distance_m, elevation_gain_m, duration_min, likes_count, thumbnail_url",
        )
        .order("created_at", { ascending: false })
        .limit(200);

      if (!ok) return;
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }

      const rows = (data ?? []) as Row[];
      let routes: RouteSummary[] = rows.map((r) => ({
        id: r.id,
        title: r.title,
        province: r.province,
        routeType: r.route_type,
        difficulty: r.difficulty,
        distanceM: r.distance_m,
        elevationGainM: r.elevation_gain_m,
        durationMin: r.duration_min,
        likesCount: r.likes_count,
        thumbnailUrl: r.thumbnail_url,
      }));

      // yazar adları
      if (rows.length) {
        const userIds = [...new Set(rows.map((r) => r.user_id))];
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, username")
          .in("id", userIds)
          .returns<{ id: string; username: string }[]>();
        const authorMap = new Map((profs ?? []).map((p) => [p.id, p.username]));
        routes = routes.map((r, i) => ({ ...r, authorUsername: authorMap.get(rows[i].user_id) }));
      }

      // kullanıcının kaydettiklerini işaretle
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && routes.length) {
        const { data: saves } = await supabase
          .from("route_saves")
          .select("route_id")
          .eq("user_id", user.id)
          .in(
            "route_id",
            routes.map((r) => r.id),
          )
          .returns<{ route_id: string }[]>();
        const set = new Set((saves ?? []).map((s) => s.route_id));
        routes = routes.map((r) => ({ ...r, saved: set.has(r.id) }));
      }

      if (ok) {
        setAll(routes);
        setLoading(false);
      }
    })();
    return () => {
      ok = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const range = distance ? DISTANCES.find((d) => d.key === distance) : null;
    const prov = province.trim().toLocaleLowerCase("tr");
    return all.filter(
      (r) =>
        (type === "all" || r.routeType === type) &&
        (diff === "all" || r.difficulty === diff) &&
        (!range || (r.distanceM >= range.min && (range.max === null || r.distanceM <= range.max))) &&
        (!prov || r.province.toLocaleLowerCase("tr").includes(prov)),
    );
  }, [all, type, diff, distance, province]);

  const hasFilter = type !== "all" || diff !== "all" || distance !== null || province.trim() !== "";
  const reset = () => {
    setType("all");
    setDiff("all");
    setDistance(null);
    setProvince("");
  };
  const toggle = <T,>(cur: T, val: T, set: (v: T) => void, none: T) =>
    set(cur === val ? none : val);

  return (
    <>
      <div className="rfilters">
        <div className="fgroup">
          <span className="lbl">Tür</span>
          {TYPES.map((t) => (
            <button key={t} className={`chip${type === t ? " active" : ""}`} onClick={() => toggle(type, t, setType, "all")}>
              {ROUTE_TYPES[t].label}
            </button>
          ))}
        </div>
        <div className="fgroup">
          <span className="lbl">Zorluk</span>
          {DIFFS.map((d) => (
            <button key={d} className={`chip d-${DIFFICULTY[d].className}${diff === d ? " active" : ""}`} onClick={() => toggle(diff, d, setDiff, "all")}>
              {DIFFICULTY[d].label}
            </button>
          ))}
        </div>
        <div className="fgroup">
          <span className="lbl">Mesafe</span>
          {DISTANCES.map((m) => (
            <button key={m.key} className={`chip${distance === m.key ? " active" : ""}`} onClick={() => setDistance(distance === m.key ? null : m.key)}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="fgroup">
          <span className="lbl">İl</span>
          <input className="il-input" placeholder="İl ara…" value={province} onChange={(e) => setProvince(e.target.value)} />
          {hasFilter && (
            <button className="chip clear" onClick={reset}>Temizle ✕</button>
          )}
        </div>
      </div>

      <div className="route-count mono">
        {loading ? "Yükleniyor…" : `${filtered.length} rota`}
      </div>

      {loading ? (
        <div className="route-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rcard-skel" />
          ))}
        </div>
      ) : error ? (
        <div className="empty" style={{ padding: "60px 20px" }}>
          Rotalar yüklenemedi.<br />
          {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty" style={{ padding: "60px 20px" }}>
          {all.length === 0 ? "Henüz rota yok. İlk rotayı sen ekle." : "Bu filtreye uyan rota yok."}
        </div>
      ) : (
        <div className="route-grid">
          {filtered.map((r) => (
            <RouteCard key={r.id} route={r} />
          ))}
        </div>
      )}
    </>
  );
}
