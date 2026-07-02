"use client";

import { useEffect, useRef } from "react";
import type { Map as MbMap } from "mapbox-gl";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

export function RouteDetailMap({
  coords,
  color = "#F2B14C",
}: {
  coords: [number, number][];
  color?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MbMap | null>(null);

  useEffect(() => {
    if (!TOKEN || !ref.current || coords.length < 2) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;
      mapboxgl.accessToken = TOKEN;

      const bounds = new mapboxgl.LngLatBounds();
      coords.forEach((c) => bounds.extend(c));

      const map = new mapboxgl.Map({
        container: ref.current!,
        style: "mapbox://styles/mapbox/dark-v11",
        bounds,
        fitBoundsOptions: { padding: 50 },
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

      map.on("load", () => {
        map.addSource("route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: coords },
          } as never,
        });
        map.addLayer({
          id: "route",
          type: "line",
          source: "route",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": color, "line-width": 4 },
        });

        const mk = (c: [number, number], bg: string) => {
          const el = document.createElement("div");
          el.className = "mk";
          el.style.background = bg;
          new mapboxgl.Marker({ element: el, anchor: "bottom" }).setLngLat(c).addTo(map);
        };
        mk(coords[0], "#54B97C"); // start
        mk(coords[coords.length - 1], "#D45D49"); // finish
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
    };
  }, [coords, color]);

  if (!TOKEN) {
    return <div className="detail-map-fallback">Harita için Mapbox token gerekli.</div>;
  }
  return <div className="detail-map" ref={ref} />;
}
