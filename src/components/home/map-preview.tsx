"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import type { MapRoute } from "@/lib/map-data";
import { DIFFICULTY } from "@/lib/types";
import { ArrowIcon, BikeIcon, MotoIcon, TentIcon } from "./icons";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const FILTERS = ["Tüm türler", "Bisiklet", "MTB", "Moto", "Kamp"];

function toGeoJSON(routes: MapRoute[]) {
  return {
    type: "FeatureCollection",
    features: routes.map((r) => ({
      type: "Feature",
      properties: { color: DIFFICULTY[r.difficulty].color },
      geometry: { type: "LineString", coordinates: r.coords },
    })),
  };
}

export function MapPreview({ routes, lang = "tr" }: { lang?: import("@/lib/i18n").Lang; routes: MapRoute[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!TOKEN || !ref.current || !routes.length) return;
    let map: import("mapbox-gl").Map | undefined;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      mapboxgl.accessToken = TOKEN;
      const bounds = new mapboxgl.LngLatBounds();
      routes.forEach((r) => r.coords.forEach((c) => bounds.extend(c)));

      map = new mapboxgl.Map({
        container: ref.current!,
        style: "mapbox://styles/mapbox/dark-v11",
        bounds,
        fitBoundsOptions: { padding: 60 },
        attributionControl: false,
        interactive: false,
      });

      map.on("load", () => {
        setReady(true);
        map!.addSource("routes", { type: "geojson", data: toGeoJSON(routes) as never });
        map!.addLayer({
          id: "routes-line",
          type: "line",
          source: "routes",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": ["get", "color"], "line-width": 3.5, "line-opacity": 0.95 },
        });
      });
    })();

    return () => map?.remove();
  }, [routes]);

  return (
    <section className="sec alt" id="harita">
      <div className="wrap">
        <div className="sec-head reveal">
          <div>
            <span className="eyebrow">{t(lang, "livemap_eyebrow")}</span>
            <h2>{t(lang, "livemap_h2")}</h2>
          </div>
          <Link className="link" href="/harita">
            Haritayı aç <ArrowIcon width={15} height={15} />
          </Link>
        </div>

        <div className="mapx reveal">
          {TOKEN && <div className="mapx-gl" ref={ref} />}

          {(!TOKEN || !ready) && (
            <>
              <div className="mapx-canvas" aria-hidden>
                <svg viewBox="0 0 1200 440" preserveAspectRatio="xMidYMid slice">
                  <g fill="none" stroke="#1c322a" strokeWidth="1.2">
                    <path d="M-20 120 C 200 80 360 160 560 120 S 920 60 1220 120" />
                    <path d="M-20 180 C 200 145 360 220 560 180 S 920 120 1220 180" />
                    <path d="M-20 250 C 200 215 360 290 560 250 S 920 190 1220 250" />
                    <path d="M-20 330 C 200 300 360 370 560 330 S 920 270 1220 330" />
                  </g>
                  <path d="M360 290 C 440 240 470 180 560 178 S 780 230 840 132" fill="none" stroke="#F2B14C" strokeWidth="3" strokeLinecap="round" />
                  <path d="M700 360 C 760 320 780 250 696 248 S 560 250 696 248" fill="none" stroke="#5FB8A3" strokeWidth="3" strokeLinecap="round" strokeDasharray="2 7" />
                </svg>
              </div>
              <div className="map-pin p1"><div className="glyph"><BikeIcon width={14} height={14} strokeWidth={2.4} /></div></div>
              <div className="map-pin p2"><div className="glyph"><MotoIcon width={13} height={13} strokeWidth={2.4} /></div></div>
              <div className="map-pin p3"><div className="glyph"><TentIcon width={13} height={13} strokeWidth={2.4} /></div></div>
            </>
          )}

          <div className="mapx-overlay">
            <div className="chips">
              {FILTERS.map((f, i) => (
                <button key={f} className={`chip${i === active ? " active" : ""}`} onClick={() => setActive(i)} type="button">
                  {f}
                </button>
              ))}
            </div>
            <div className="mapx-card">
              <h3>{t(lang, "livemap_h3")}</h3>
              <p>{t(lang, "livemap_p")}</p>
              <Link className="btn btn-primary btn-sm" href="/harita">
                {t(lang, "livemap_cta")} <ArrowIcon width={15} height={15} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
