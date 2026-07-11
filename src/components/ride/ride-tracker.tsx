"use client";

// Sürüş Modu v2 — takip + kayıt, duraklat/devam, hız, sapma hassasiyeti.
// Web sınırı: ekran açık kalmalı (Wake Lock uyumayı engeller).

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lang } from "@/lib/i18n";

type LngLat = [number, number];

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const SENS = [
  { key: "hassas", m: 40 },
  { key: "normal", m: 80 },
  { key: "rahat", m: 150 },
] as const;

function havKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function simplify(pts: LngLat[], max = 150): LngLat[] {
  if (pts.length <= max) return pts;
  const step = Math.ceil(pts.length / max);
  const out: LngLat[] = [];
  for (let i = 0; i < pts.length; i += step) out.push(pts[i]);
  if (out[out.length - 1] !== pts[pts.length - 1]) out.push(pts[pts.length - 1]);
  return out;
}

function fmtClock(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

export function RideTracker({
  mode,
  lang = "tr",
  route,
}: {
  mode: "follow" | "record";
  lang?: Lang;
  route?: { id: string; title: string; coords: LngLat[]; distanceM: number };
}) {
  const L = (tr: string, en: string) => (lang === "en" ? en : tr);
  const router = useRouter();
  const pathname = usePathname();

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("mapbox-gl").Map | null>(null);
  const glRef = useRef<typeof import("mapbox-gl") | null>(null);
  const markerRef = useRef<import("mapbox-gl").Marker | null>(null);
  const watchRef = useRef<number | null>(null);
  const wakeRef = useRef<{ release: () => Promise<void> } | null>(null);

  // iz: segment listesi (duraklamada segment kapanır, ışınlanma çizgisi oluşmaz)
  const segsRef = useRef<LngLat[][]>([]);
  const lastPtRef = useRef<LngLat | null>(null);
  const lastRawRef = useRef<{ pt: LngLat; ts: number } | null>(null);
  const offSinceRef = useRef<number | null>(null);

  // süre: birikmiş + aktif dilim
  const accumRef = useRef(0);
  const segStartRef = useRef<number | null>(null);

  const [status, setStatus] = useState<"idle" | "live" | "paused" | "saving" | "done">("idle");
  const [gpsErr, setGpsErr] = useState("");
  const [distKm, setDistKm] = useState(0); // record: kaydedilen · follow: kalan
  const [pct, setPct] = useState(0);
  const [speed, setSpeed] = useState(0); // km/s (yumuşatılmış)
  const [elapsed, setElapsed] = useState(0);
  const [offRoute, setOffRoute] = useState(false);
  const [nearEnd, setNearEnd] = useState(false);
  const [sensIdx, setSensIdx] = useState(1); // normal

  const cumRef = useRef<number[]>([]);
  useEffect(() => {
    if (mode !== "follow" || !route) return;
    const cum = [0];
    for (let i = 1; i < route.coords.length; i++) {
      cum.push(cum[i - 1] + havKm(route.coords[i - 1], route.coords[i]));
    }
    cumRef.current = cum;
    setDistKm(cum[cum.length - 1]);
  }, [mode, route]);

  // ---- harita ----
  useEffect(() => {
    if (!TOKEN || !mapEl.current) return;
    let cancelled = false;
    (async () => {
      const gl = (await import("mapbox-gl")).default;
      if (cancelled || !mapEl.current) return;
      glRef.current = gl as unknown as typeof import("mapbox-gl");
      gl.accessToken = TOKEN;
      const start = mode === "follow" && route ? route.coords[0] : ([32.85, 39.0] as LngLat);
      const map = new gl.Map({
        container: mapEl.current,
        style: "mapbox://styles/mapbox/outdoors-v12",
        center: start,
        zoom: mode === "follow" ? 13 : 5,
        attributionControl: false,
      });
      mapRef.current = map;
      map.on("load", () => {
        if (mode === "follow" && route) {
          map.addSource("route", {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: route.coords } } as never,
          });
          map.addLayer({
            id: "route-line",
            type: "line",
            source: "route",
            paint: { "line-color": "#F2B14C", "line-width": 5 },
            layout: { "line-cap": "round", "line-join": "round" },
          });
          const b = new gl.LngLatBounds(route.coords[0], route.coords[0]);
          route.coords.forEach((c) => b.extend(c));
          map.fitBounds(b, { padding: 60 });
        }
        map.addSource("trail", {
          type: "geojson",
          data: { type: "Feature", properties: {}, geometry: { type: "MultiLineString", coordinates: [] } } as never,
        });
        map.addLayer({
          id: "trail-line",
          type: "line",
          source: "trail",
          paint: { "line-color": "#5FB8A3", "line-width": 5 },
          layout: { "line-cap": "round", "line-join": "round" },
        });
      });
    })();
    const onVis = () => {
      if (document.visibilityState === "visible" && watchRef.current !== null) acquireWake();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVis);
      stopAll();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // süre sayacı
  useEffect(() => {
    if (status !== "live") return;
    const t = setInterval(() => {
      const seg = segStartRef.current ? (Date.now() - segStartRef.current) / 1000 : 0;
      setElapsed(accumRef.current + seg);
    }, 1000);
    return () => clearInterval(t);
  }, [status]);

  function stopAll() {
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    wakeRef.current?.release().catch(() => {});
    wakeRef.current = null;
  }

  async function acquireWake() {
    try {
      wakeRef.current = (await navigator.wakeLock?.request("screen")) ?? null;
    } catch {
      /* desteklenmiyorsa sessizce geç */
    }
  }

  function trailFlat(): LngLat[] {
    return segsRef.current.flat();
  }

  function trailDist(): number {
    let s = 0;
    for (const seg of segsRef.current) {
      for (let i = 1; i < seg.length; i++) s += havKm(seg[i - 1], seg[i]);
    }
    return s;
  }

  function updateSpeed(pt: LngLat, ts: number) {
    const prev = lastRawRef.current;
    lastRawRef.current = { pt, ts };
    if (!prev) return;
    const dtH = (ts - prev.ts) / 3600000;
    if (dtH <= 0) return;
    const v = havKm(prev.pt, pt) / dtH;
    if (v > 90) return; // GPS sıçraması
    setSpeed((old) => Math.max(0, old * 0.6 + v * 0.4));
  }

  function onPos(p: GeolocationPosition) {
    // doğruluk filtresi: 40 m'den kötü fix'ler izi kirletmesin
    if (p.coords.accuracy != null && p.coords.accuracy > 40) return;

    const pt: LngLat = [p.coords.longitude, p.coords.latitude];
    const map = mapRef.current;
    const gl = glRef.current;
    if (!map || !gl) return;

    const spd = p.coords.speed;
    if (spd != null && spd >= 0) setSpeed((old) => Math.max(0, old * 0.6 + spd * 3.6 * 0.4));
    else updateSpeed(pt, p.timestamp);

    if (!markerRef.current) {
      const el = document.createElement("div");
      el.className = "ride-dot";
      markerRef.current = new gl.Marker({ element: el }).setLngLat(pt).addTo(map);
      map.easeTo({ center: pt, zoom: 15, duration: 800 });
    } else {
      markerRef.current.setLngLat(pt);
      map.easeTo({ center: pt, duration: 600 });
    }

    if (mode === "record") {
      const seg = segsRef.current[segsRef.current.length - 1];
      const last = lastPtRef.current;
      if (!last || havKm(last, pt) * 1000 >= 8) {
        seg.push(pt);
        lastPtRef.current = pt;
        setDistKm(trailDist());
        (map.getSource("trail") as import("mapbox-gl").GeoJSONSource | undefined)?.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "MultiLineString", coordinates: segsRef.current },
        } as never);
      }
      return;
    }

    if (!route) return;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < route.coords.length; i++) {
      const dd = havKm(route.coords[i], pt);
      if (dd < bestD) {
        bestD = dd;
        best = i;
      }
    }
    const cum = cumRef.current;
    const total = cum[cum.length - 1] || 1;
    const doneKm = cum[best];
    setPct(Math.min(100, Math.round((doneKm / total) * 100)));
    setDistKm(Math.max(0, total - doneKm));

    const limit = SENS[sensIdx].m;
    if (bestD * 1000 > limit) {
      if (offSinceRef.current === null) offSinceRef.current = Date.now();
      else if (Date.now() - offSinceRef.current > 15000) setOffRoute(true);
    } else {
      offSinceRef.current = null;
      setOffRoute(false);
    }

    const endD = havKm(route.coords[route.coords.length - 1], pt) * 1000;
    setNearEnd(endD < 80 && doneKm / total > 0.7);
  }

  function startWatch() {
    watchRef.current = navigator.geolocation.watchPosition(onPos, () => {
      setGpsErr(L("Konum alınamadı — tarayıcıdan konum izni vermen gerekiyor.", "Couldn't get your location — please allow location access."));
      setStatus("idle");
      stopAll();
    }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
  }

  function begin() {
    if (!navigator.geolocation) {
      setGpsErr(L("Tarayıcın konum özelliğini desteklemiyor.", "Your browser doesn't support location."));
      return;
    }
    setGpsErr("");
    accumRef.current = 0;
    segStartRef.current = Date.now();
    segsRef.current = [[]];
    lastPtRef.current = null;
    lastRawRef.current = null;
    setStatus("live");
    acquireWake();
    startWatch();
  }

  function pause() {
    if (segStartRef.current) {
      accumRef.current += (Date.now() - segStartRef.current) / 1000;
      segStartRef.current = null;
    }
    stopAll();
    setSpeed(0);
    setStatus("paused");
  }

  function resume() {
    segStartRef.current = Date.now();
    if (mode === "record") {
      segsRef.current.push([]); // yeni segment — molada yer değiştiyse çizgi bağlanmaz
      lastPtRef.current = null;
    }
    lastRawRef.current = null;
    setStatus("live");
    acquireWake();
    startWatch();
  }

  async function finishFollow() {
    if (!route) return;
    setStatus("saving");
    stopAll();
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=${pathname}`);
      return;
    }
    await supabase
      .from("route_completions")
      .upsert({ route_id: route.id, user_id: user.id } as never, {
        onConflict: "user_id,route_id",
        ignoreDuplicates: true,
      });
    setStatus("done");
  }

  function stopRecord() {
    stopAll();
    const pts = simplify(trailFlat());
    if (pts.length < 2) {
      setGpsErr(L("Kayıt çok kısa — en az iki nokta gerekli.", "Recording too short — at least two points needed."));
      setStatus("idle");
      return;
    }
    try {
      sessionStorage.setItem("rwi_recorded_track", JSON.stringify({ points: pts }));
    } catch {
      /* dolu olabilir */
    }
    router.push("/rotalar/yeni?kayit=1");
  }

  if (!TOKEN) {
    return (
      <div className="ride-fallback">
        <p><code>NEXT_PUBLIC_MAPBOX_TOKEN</code> {L("gerekli.", "is required.")}</p>
      </div>
    );
  }

  const sensLabel =
    SENS[sensIdx].key === "hassas"
      ? L("Hassas", "Strict")
      : SENS[sensIdx].key === "rahat"
        ? L("Rahat", "Relaxed")
        : "Normal";

  return (
    <div className="ride-wrap">
      <div ref={mapEl} className="ride-map" />

      <div className="ride-top">
        <div className="ride-title-row">
          <div className="ride-title">
            {mode === "follow" ? route?.title : L("⏺ Rota kaydı", "⏺ Route recording")}
          </div>
          {mode === "follow" && (
            <button
              type="button"
              className="ride-sens"
              onClick={() => setSensIdx((i) => (i + 1) % SENS.length)}
              title={L("Sapma uyarısı hassasiyeti", "Off-route alert sensitivity")}
            >
              🎯 {sensLabel} · {SENS[sensIdx].m}m
            </button>
          )}
        </div>
        {(status === "live" || status === "paused") && (
          <div className="ride-stats mono">
            <span>
              <b>{distKm.toFixed(1)}</b> km{mode === "follow" ? ` ${L("kaldı", "left")}` : ""}
            </span>
            {mode === "follow" && <span><b>%{pct}</b></span>}
            <span><b>{speed.toFixed(1)}</b> km/s</span>
            <span><b>{fmtClock(elapsed)}</b></span>
            {status === "paused" && <span className="ride-paused">⏸ {L("Duraklatıldı", "Paused")}</span>}
          </div>
        )}
      </div>

      {offRoute && status === "live" && (
        <div className="ride-offroute">{L("⚠ Rotadan uzaklaştın", "⚠ You're off the route")}</div>
      )}
      {gpsErr && <div className="ride-offroute">{gpsErr}</div>}

      <div className="ride-controls">
        {status === "idle" && (
          <button type="button" className="btn btn-primary ride-big" onClick={begin}>
            {mode === "follow" ? L("▶ Sürüşü başlat", "▶ Start ride") : L("⏺ Kaydı başlat", "⏺ Start recording")}
          </button>
        )}

        {(status === "live" || status === "paused") && (
          <div className="ride-row">
            {status === "live" ? (
              <button type="button" className="btn btn-ghost ride-big" onClick={pause}>
                ⏸ {L("Duraklat", "Pause")}
              </button>
            ) : (
              <button type="button" className="btn btn-primary ride-big" onClick={resume}>
                ▶ {L("Devam", "Resume")}
              </button>
            )}
            {mode === "follow" ? (
              <button
                type="button"
                className={`btn ride-big ${nearEnd ? "btn-primary" : "btn-ghost"}`}
                onClick={finishFollow}
              >
                {nearEnd ? L("🏁 Bitir — vardın!", "🏁 Finish!") : L("🏁 Bitir", "🏁 Finish")}
              </button>
            ) : (
              <button type="button" className="btn btn-ghost ride-big" onClick={stopRecord}>
                ⏹ {L("Durdur", "Stop")}
              </button>
            )}
          </div>
        )}

        {status === "saving" && <div className="ride-note">{L("Kaydediliyor…", "Saving…")}</div>}
        {status === "live" && (
          <p className="ride-note">{L("Ekran, sürüş boyunca açık kalır.", "The screen stays awake during your ride.")}</p>
        )}
        {status === "paused" && mode === "record" && (
          <p className="ride-note">{L("Molada yer değişirse iz bağlanmaz — içiniz rahat.", "If you move during the break, the trail won't connect — no worries.")}</p>
        )}
      </div>

      {status === "done" && route && (
        <div className="ride-finish">
          <div className="ride-finish-card">
            <div style={{ fontSize: 64 }}>🏁</div>
            <h2>{L("Rota tamamlandı!", "Route completed!")}</h2>
            <p>{route.title} — {L("profiline işlendi.", "added to your profile.")}</p>
            <a className="btn btn-primary" href={`/rotalar/${route.id}`}>
              {L("Rotaya dön", "Back to the route")}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
