"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type mapboxglType from "mapbox-gl";
import type { Map as MbMap, Marker, Popup } from "mapbox-gl";
import type { MapRoute } from "@/lib/map-data";
import type { RouteType, Difficulty } from "@/lib/types";
import { DIFFICULTY, km, formatDuration } from "@/lib/types";
import { RouteTypeIcon, PinIcon } from "@/components/home/icons";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

const TYPE_FILTERS: { key: "all" | RouteType; label: string }[] = [
  { key: "all", label: "Tümü" },
  { key: "yol", label: "Yol" },
  { key: "mtb", label: "MTB" },
  { key: "moto", label: "Moto" },
  { key: "kamp", label: "Kamp" },
];
const DIFF_FILTERS: { key: "all" | Difficulty; label: string; cls: string }[] = [
  { key: "all", label: "Tümü", cls: "" },
  { key: "kolay", label: "Kolay", cls: "d-easy" },
  { key: "orta", label: "Orta", cls: "d-mod" },
  { key: "zor", label: "Zor", cls: "d-hard" },
  { key: "uzman", label: "Uzman", cls: "d-expert" },
];

function toGeoJSON(routes: MapRoute[]) {
  return {
    type: "FeatureCollection" as const,
    features: routes.map((r) => ({
      type: "Feature" as const,
      properties: { id: r.id, color: DIFFICULTY[r.difficulty].color },
      geometry: { type: "LineString" as const, coordinates: r.coords },
    })),
  };
}

export function MapExplorer({ routes }: { routes: MapRoute[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MbMap | null>(null);
  const glRef = useRef<typeof mapboxglType | null>(null);
  const markersRef = useRef<Marker[]>([]);
  const popupRef = useRef<Popup | null>(null);

  const [type, setType] = useState<"all" | RouteType>("all");
  const [diff, setDiff] = useState<"all" | Difficulty>("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const filtered = useMemo(
    () =>
      routes.filter(
        (r) =>
          (type === "all" || r.type === type) &&
          (diff === "all" || r.difficulty === diff),
      ),
    [routes, type, diff],
  );

  // --- init map once ---
  useEffect(() => {
    if (!TOKEN || !containerRef.current) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;
      glRef.current = mapboxgl;
      mapboxgl.accessToken = TOKEN;

      const map = new mapboxgl.Map({
        container: containerRef.current!,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [35.2, 39.2],
        zoom: 5.1,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

      map.on("load", () => {
        map.addSource("routes", { type: "geojson", data: toGeoJSON(routes) });
        map.addLayer({
          id: "routes-line",
          type: "line",
          source: "routes",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": ["get", "color"], "line-width": 4, "line-opacity": 0.95 },
        });
        map.on("click", "routes-line", (e) => {
          const feature = e.features?.[0] as { properties?: { id?: string } } | undefined;
          const id = feature?.properties?.id;
          if (id) setSelected((cur) => (cur === id ? null : id));
        });
        map.on("mouseenter", "routes-line", () => (map.getCanvas().style.cursor = "pointer"));
        map.on("mouseleave", "routes-line", () => (map.getCanvas().style.cursor = ""));
        setReady(true);
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- keep map data + markers in sync with filters ---
  useEffect(() => {
    const map = mapRef.current;
    const gl = glRef.current;
    if (!ready || !map || !gl) return;

    (map.getSource("routes") as import("mapbox-gl").GeoJSONSource | undefined)?.setData(
      toGeoJSON(filtered) as never,
    );

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = filtered.map((r) => {
      const el = document.createElement("div");
      el.className = "mk";
      el.style.background = DIFFICULTY[r.difficulty].color;
      el.style.color = "#0c1512";
      el.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${
        r.type === "moto"
          ? '<circle cx="5" cy="17" r="2.6"/><circle cx="19" cy="17" r="2.6"/><path d="M5 17h6l3-5 4 5M9 8h4l2 4"/>'
          : r.type === "kamp"
            ? '<path d="M3 20h18L12 4z"/><path d="M12 4v16"/>'
            : '<circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 17l4-8h5l-3 8M10 9l-2-3h3"/>'
      }</svg>`;
      el.addEventListener("click", (ev) => {
        ev.stopPropagation();
        setSelected((cur) => (cur === r.id ? null : r.id));
      });
      return new gl.Marker({ element: el, anchor: "bottom" }).setLngLat(r.coords[0]).addTo(map);
    });
  }, [filtered, ready]);

  // --- fly to + popup when a route is selected ---
  useEffect(() => {
    const map = mapRef.current;
    const gl = glRef.current;
    if (!ready || !map || !gl) return;
    popupRef.current?.remove();
    if (!selected) return;
    const r = routes.find((x) => x.id === selected);
    if (!r) return;

    const bounds = new gl.LngLatBounds();
    r.coords.forEach((c) => bounds.extend(c));
    map.fitBounds(bounds, { padding: 120, maxZoom: 11, duration: 800 });

    const d = DIFFICULTY[r.difficulty];
    const nav = `https://www.google.com/maps/dir/?api=1&destination=${r.coords[0][1]},${r.coords[0][0]}`;
    popupRef.current = new gl.Popup({ offset: 26 })
      .setLngLat(r.coords[Math.floor(r.coords.length / 2)])
      .setHTML(
        `<div class="pop"><h4>${r.title}</h4><div class="ploc">${r.province} · ${d.label}</div>
        <div class="pstats"><span><b>${km(r.distanceM)}</b> km</span><span>↑<b>${r.elevationGainM.toLocaleString("tr-TR")}</b> m</span><span><b>${formatDuration(r.durationMin)}</b></span></div>
        <div class="pop-actions"><a href="/rotalar/${r.id}">Detay →</a><a href="${nav}" target="_blank" rel="noopener noreferrer">Navigasyon ⌖</a></div></div>`,
      )
      .addTo(map);
  }, [selected, ready, routes]);

  return (
    <div className="explorer">
      <div className="side">
        <div className="filters" style={{ position: "sticky", top: 0, margin: "-14px -14px 12px", background: "var(--bg)" }}>
          <div className="fgroup">
            <span className="lbl">Tür</span>
            {TYPE_FILTERS.map((f) => (
              <button key={f.key} className={`chip${type === f.key ? " active" : ""}`} onClick={() => { setType(f.key); setSelected(null); }}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="fgroup">
            <span className="lbl">Zorluk</span>
            {DIFF_FILTERS.map((f) => (
              <button key={f.key} className={`chip ${f.cls}${diff === f.key ? " active" : ""}`} onClick={() => { setDiff(f.key); setSelected(null); }}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="count"><b>{filtered.length}</b> rota</div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">Bu filtreye uyan rota yok.<br />Filtreleri sıfırlamayı dene.</div>
        ) : (
          filtered.map((r) => {
            const d = DIFFICULTY[r.difficulty];
            const nav = `https://www.google.com/maps/dir/?api=1&destination=${r.coords[0][1]},${r.coords[0][0]}`;
            return (
              <div key={r.id} className={`lroute${selected === r.id ? " sel" : ""}`} onClick={() => setSelected((cur) => (cur === r.id ? null : r.id))}>
                <div className="bar" style={{ background: d.color }} />
                <div className="info">
                  <div className="top">
                    <h3>{r.title}</h3>
                    <span className="rtype"><RouteTypeIcon type={r.type} width={15} height={15} /></span>
                  </div>
                  <div className="loc"><PinIcon width={11} height={11} /> {r.province}</div>
                  <div className="stats">
                    <span className="diff-tag" style={{ color: d.color, border: `1px solid ${d.color}` }}>{d.label}</span>
                    <span><b>{km(r.distanceM)}</b> km</span>
                    <span>↑ <b>{r.elevationGainM.toLocaleString("tr-TR")}</b> m</span>
                    <span><b>{formatDuration(r.durationMin)}</b></span>
                    <span>♥ {r.likes}</span>
                  </div>
                </div>
                <div className="lroute-actions">
                  <a
                    className="lr-btn"
                    href={nav}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Google navigasyon"
                    title="Navigasyonu başlat"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L4.5 20.3a.5.5 0 00.65.65L12 18l6.85 2.95a.5.5 0 00.65-.65L12 2z" />
                    </svg>
                  </a>
                  <Link
                    className="lr-btn"
                    href={`/rotalar/${r.id}`}
                    aria-label="Rota detayı"
                    title="Detaya git"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="map-wrap">
        {TOKEN ? (
          <div id="map" ref={containerRef} />
        ) : (
          <div className="map-fallback">
            <h3>Mapbox token eksik</h3>
            <p><code>NEXT_PUBLIC_MAPBOX_TOKEN</code> ekleyip yeniden başlat. Filtreler ve liste token olmadan da çalışıyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
