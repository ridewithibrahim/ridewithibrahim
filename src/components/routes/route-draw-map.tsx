"use client";

import { useEffect, useRef } from "react";
import type mapboxglType from "mapbox-gl";
import type { Map as MbMap } from "mapbox-gl";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/** Haritaya tıklayarak rota çizme. Her tıklama bir nokta ekler. */
export function RouteDrawMap({
  points,
  onAdd,
}: {
  points: [number, number][];
  onAdd: (p: [number, number]) => void;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MbMap | null>(null);
  const glRef = useRef<typeof mapboxglType | null>(null);
  const readyRef = useRef(false);
  const onAddRef = useRef(onAdd);
  onAddRef.current = onAdd;

  // Haritayı bir kez kur
  useEffect(() => {
    if (!TOKEN || !mapEl.current) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;
      glRef.current = mapboxgl;
      mapboxgl.accessToken = TOKEN;

      const map = new mapboxgl.Map({
        container: mapEl.current!,
        style: "mapbox://styles/mapbox/dark-v11",
        center: [35.2, 39.2],
        zoom: 5.2,
        attributionControl: false,
      });
      mapRef.current = map;
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
      map.getCanvas().style.cursor = "crosshair";

      map.on("click", (e) => {
        onAddRef.current([e.lngLat.lng, e.lngLat.lat]);
      });

      map.on("load", () => {
        map.addSource("draw", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        map.addLayer({
          id: "draw-line",
          type: "line",
          source: "draw",
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": "#F2B14C", "line-width": 4, "line-opacity": 0.95 },
        });
        map.addLayer({
          id: "draw-pts",
          type: "circle",
          source: "draw",
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-radius": 5,
            "circle-color": "#F2B14C",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#0C1512",
          },
        });
        readyRef.current = true;
      });
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      readyRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Noktalar değiştikçe çizimi güncelle
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource("draw") as { setData: (d: unknown) => void } | undefined;
    if (!src) return;

    src.setData({
      type: "FeatureCollection",
      features: [
        ...(points.length >= 2
          ? [{ type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: points } }]
          : []),
        ...points.map((p) => ({
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: p },
        })),
      ],
    });
  }, [points]);

  return <div ref={mapEl} className="rf-map draw-map" />;
}
