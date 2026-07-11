"use client";

// Sürüş Modu — iki vites:
//  follow: mevcut rotayı canlı takip et, bitişte otomatik "Tamamlandı"
//  record: sürülen izi kaydet, rota formuna hazır çizgi olarak aktar
// Web sınırı: ekran açık kalmalı (Wake Lock ile uyumayı engelliyoruz).

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Lang } from "@/lib/i18n";

type LngLat = [number, number];

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

function havKm(a: LngLat, b: LngLat): number {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Uzun izi forma taşımadan önce seyrelt (maks ~150 nokta). */
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
  const trailRef = useRef<LngLat[]>([]);
  const lastPtRef = useRef<LngLat | null>(null);
  const offSinceRef = useRef<number | null>(null);
  const startTsRef = useRef<number>(0);

  const [status, setStatus] = useState<"idle" | "live" | "saving" | "done">("idle");
  const [gpsErr, setGpsErr] = useState("");
  const [ready, setReady] = useState(false);
  const [distKm, setDistKm] = useState(0); // record: kaydedilen · follow: kalan
  const [pct, setPct] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [offRoute, setOffRoute] = useState(false);
  const [nearEnd, setNearEnd] = useState(false);

  // rota kümülatif mesafeleri (follow)
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

  // ---- harita kur ----
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
          data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: [] } } as never,
        });
        map.addLayer({
          id: "trail-line",
          type: "line",
          source: "trail",
          paint: { "line-color": "#5FB8A3", "line-width": 5 },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        setReady(true);
      });
    })();
    return () => {
      cancelled = true;
      stopAll();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // süre sayacı
  useEffect(() => {
    if (status !== "live") return;
    const t = setInterval(() => setElapsed((Date.now() - startTsRef.current) / 1000), 1000);
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

  function onPos(p: GeolocationPosition) {
    const pt: LngLat = [p.coords.longitude, p.coords.latitude];
    const map = mapRef.current;
    const gl = glRef.current;
    if (!map || !gl) return;

    // canlı nokta
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
      const last = lastPtRef.current;
      if (!last || havKm(last, pt) * 1000 >= 8) {
        trailRef.current.push(pt);
        lastPtRef.current = pt;
        if (trailRef.current.length >= 2) {
          const total = trailRef.current.reduce(
            (s, c, i) => (i === 0 ? 0 : s + havKm(trailRef.current[i - 1], c)),
            0,
          );
          setDistKm(total);
        }
        (map.getSource("trail") as import("mapbox-gl").GeoJSONSource | undefined)?.setData({
          type: "Feature",
          properties: {},
          geometry: { type: "LineString", coordinates: trailRef.current },
        } as never);
      }
      return;
    }

    // follow: en yakın rota noktası → ilerleme
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

    // rotadan sapma: 80 m'den uzakta 15 sn
    if (bestD * 1000 > 80) {
      if (offSinceRef.current === null) offSinceRef.current = Date.now();
      else if (Date.now() - offSinceRef.current > 15000) setOffRoute(true);
    } else {
      offSinceRef.current = null;
      setOffRoute(false);
    }

    // bitişe yaklaşma
    const endD = havKm(route.coords[route.coords.length - 1], pt) * 1000;
    setNearEnd(endD < 80 && doneKm / total > 0.7);
  }

  function begin() {
    if (!navigator.geolocation) {
      setGpsErr(L("Tarayıcın konum özelliğini desteklemiyor.", "Your browser doesn't support location."));
      return;
    }
    setGpsErr("");
    startTsRef.current = Date.now();
    setStatus("live");
    acquireWake();
    const onVis = () => {
      if (document.visibilityState === "visible") acquireWake();
    };
    document.addEventListener("visibilitychange", onVis);
    watchRef.current = navigator.geolocation.watchPosition(onPos, () => {
      setGpsErr(L("Konum alınamadı — tarayıcıdan konum izni vermen gerekiyor.", "Couldn't get your location — please allow location access."));
      setStatus("idle");
      stopAll();
    }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
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
    const pts = simplify(trailRef.current);
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

  return (
    <div className="ride-wrap">
      <div ref={mapEl} className="ride-map" />

      {/* üst bilgi çubuğu */}
      <div className="ride-top">
        <div className="ride-title">
          {mode === "follow" ? route?.title : L("⏺ Rota kaydı", "⏺ Route recording")}
        </div>
        {status === "live" && (
          <div className="ride-stats mono">
            <span>
              <b>{distKm.toFixed(1)}</b> km {mode === "follow" ? L("kaldı", "left") : ""}
            </span>
            {mode === "follow" && <span><b>%{pct}</b></span>}
            <span><b>{fmtClock(elapsed)}</b></span>
          </div>
        )}
      </div>

      {offRoute && status === "live" && (
        <div className="ride-offroute">{L("⚠ Rotadan uzaklaştın", "⚠ You're off the route")}</div>
      )}
      {gpsErr && <div className="ride-offroute">{gpsErr}</div>}

      {/* alt kontroller */}
      <div className="ride-controls">
        {status === "idle" && (
          <button type="button" className="btn btn-primary ride-big" onClick={begin}>
            {mode === "follow" ? L("▶ Sürüşü başlat", "▶ Start ride") : L("⏺ Kaydı başlat", "⏺ Start recording")}
          </button>
        )}
        {status === "live" && mode === "follow" && (
          <button
            type="button"
            className={`btn ride-big ${nearEnd ? "btn-primary" : "btn-ghost"}`}
            onClick={finishFollow}
          >
            {nearEnd ? L("🏁 Bitir — vardın!", "🏁 Finish — you made it!") : L("🏁 Sürüşü bitir", "🏁 End ride")}
          </button>
        )}
        {status === "live" && mode === "record" && (
          <button type="button" className="btn btn-primary ride-big" onClick={stopRecord}>
            {L("⏹ Durdur ve rotaya dönüştür", "⏹ Stop & turn into a route")}
          </button>
        )}
        {status === "saving" && <div className="ride-note">{L("Kaydediliyor…", "Saving…")}</div>}
        {status === "live" && (
          <p className="ride-note">{L("Ekran, sürüş boyunca açık kalır.", "The screen stays awake during your ride.")}</p>
        )}
      </div>

      {/* bitiş kutlaması */}
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
