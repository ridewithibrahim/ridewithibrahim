"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { type Lang, typeName, diffName } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Map as MbMap } from "mapbox-gl";
import { createClient } from "@/lib/supabase/client";
import { parseGpx, type ParsedGpx } from "@/lib/gpx";
import { routeFormSchema, type RouteFormValues } from "@/lib/validations/route";
import { DIFFICULTY, km, formatDuration } from "@/lib/types";
import { RouteDrawMap } from "@/components/routes/route-draw-map";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
const TYPES = ["yol", "mtb", "moto", "kamp"] as const;
const DIFFS = ["kolay", "orta", "zor", "uzman"] as const;

// Çizilen rotalarda süre tahmini için ortalama hızlar (km/sa)
const SPEED_KMH: Record<(typeof TYPES)[number], number> = { yol: 24, mtb: 14, moto: 55, kamp: 5 };

function havKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function RouteForm({ lang = "tr" }: { lang?: Lang } = {}) {
  const L = (tr: string, en: string) => (lang === "en" ? en : tr);
  const router = useRouter();
  const [gpx, setGpx] = useState<ParsedGpx | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"gpx" | "draw">("gpx");
  const [drawn, setDrawn] = useState<[number, number][]>([]);
  const [drawElev, setDrawElev] = useState<string>("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [photoError, setPhotoError] = useState<string>("");
  const [parseError, setParseError] = useState<string>("");
  const [submitError, setSubmitError] = useState<string>("");

  // Sürüş Modu kaydından gelen iz varsa çizim moduna hazır getir.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("rwi_recorded_track");
      if (!raw) return;
      sessionStorage.removeItem("rwi_recorded_track");
      const parsed = JSON.parse(raw) as { points?: [number, number][] };
      if (parsed.points && parsed.points.length >= 2) {
        setMode("draw");
        setDrawn(parsed.points);
      }
    } catch {
      /* bozuk veri — sessizce yok say */
    }
  }, []);
  const [saving, setSaving] = useState(false);

  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MbMap | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RouteFormValues>({
    resolver: zodResolver(routeFormSchema),
  });
  const routeType = watch("routeType");
  const difficulty = watch("difficulty");

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    setParseError("");
    const f = e.target.files?.[0];
    if (!f) return;
    setFileName(f.name);
    setFile(f);
    try {
      const parsed = parseGpx(await f.text());
      setGpx(parsed);
      if (parsed.name) setValue("title", parsed.name, { shouldValidate: true });
    } catch (err) {
      setGpx(null);
      setParseError(err instanceof Error ? err.message : L("GPX işlenemedi.", "Couldn't parse the GPX file."));
    }
  }

  function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    setPhotoError("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setPhotoError(L("Lütfen bir görsel dosyası seç (JPG, PNG, WebP).", "Please choose an image file (JPG, PNG, WebP)."));
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setPhotoError(L("Fotoğraf 5 MB'dan büyük olamaz.", "The photo can't exceed 5 MB."));
      return;
    }
    setPhoto(f);
    setPhotoPreview(URL.createObjectURL(f));
  }

  // Mapbox preview of the parsed track
  useEffect(() => {
    if (!TOKEN || !gpx || !mapEl.current) return;
    let cancelled = false;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled) return;
      mapboxgl.accessToken = TOKEN;

      const data = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: gpx.coords },
          },
        ],
      };

      const bounds = new mapboxgl.LngLatBounds();
      gpx.coords.forEach((c) => bounds.extend(c));

      if (!mapRef.current) {
        const map = new mapboxgl.Map({
          container: mapEl.current!,
          style: "mapbox://styles/mapbox/dark-v11",
          bounds,
          fitBoundsOptions: { padding: 40 },
          attributionControl: false,
        });
        mapRef.current = map;
        map.on("load", () => {
          map.addSource("track", { type: "geojson", data: data as never });
          map.addLayer({
            id: "track",
            type: "line",
            source: "track",
            layout: { "line-cap": "round", "line-join": "round" },
            paint: { "line-color": "#F2B14C", "line-width": 4 },
          });
        });
      } else {
        const map = mapRef.current;
        (map.getSource("track") as import("mapbox-gl").GeoJSONSource)?.setData(data as never);
        map.fitBounds(bounds, { padding: 40, duration: 600 });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gpx]);

  useEffect(() => () => mapRef.current?.remove(), []);

  const drawDistM = useMemo(() => {
    let s = 0;
    for (let i = 1; i < drawn.length; i++) s += havKm(drawn[i - 1], drawn[i]);
    return Math.round(s * 1000);
  }, [drawn]);

  async function onSubmit(values: RouteFormValues) {
    setSubmitError("");
    if (mode === "gpx" && (!gpx || !file)) {
      setSubmitError(L("Önce bir GPX dosyası yükle.", "Upload a GPX file first."));
      return;
    }
    if (mode === "draw" && drawn.length < 2) {
      setSubmitError(L("Haritaya tıklayarak en az 2 nokta ekle.", "Click the map to add at least 2 points."));
      return;
    }
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error(L("Oturum bulunamadı, tekrar giriş yap.", "Session not found — please log in again."));

      // 1) Rota verisini kaynağına göre hazırla
      let gpxUrl = "";
      let coords: [number, number][];
      let distanceM: number;
      let elevationM: number;
      let durationMin: number;

      if (mode === "gpx" && gpx && file) {
        // GPX'i Storage'a yükle
        const path = `${user.id}/${crypto.randomUUID()}.gpx`;
        const { error: upErr } = await supabase.storage
          .from("gpx")
          .upload(path, file, { contentType: "application/gpx+xml", upsert: false });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("gpx").getPublicUrl(path);
        gpxUrl = pub.publicUrl;
        coords = gpx.coords;
        distanceM = gpx.distanceM;
        elevationM = gpx.elevationGainM;
        durationMin = gpx.durationMin;
      } else {
        // Haritada çizilen rota
        coords = drawn;
        distanceM = drawDistM;
        elevationM = Math.max(0, Math.round(Number(drawElev) || 0));
        durationMin = Math.max(1, Math.round((distanceM / 1000 / SPEED_KMH[values.routeType]) * 60));
      }

      // 2) Rotayı RPC ile kaydet (geometry güvenli şekilde yazılır)
      const routeArgs = {
        p_title: values.title,
        p_description: values.description || "",
        p_route_type: values.routeType,
        p_difficulty: values.difficulty,
        p_province: values.province,
        p_distance_m: distanceM,
        p_elevation_gain_m: elevationM,
        p_duration_min: durationMin,
        p_coords: coords,
        p_gpx_url: gpxUrl,
      };
      const { data: id, error } = await supabase.rpc("create_route", routeArgs as never);
      if (error) throw error;

      // 3) Fotoğraf varsa yükle ve rotaya bağla (RLS: sahibi güncelleyebilir)
      if (photo && id) {
        const ext = photo.name.split(".").pop() || "jpg";
        const photoPath = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: pErr } = await supabase.storage
          .from("route-thumbnails")
          .upload(photoPath, photo, { contentType: photo.type });
        if (!pErr) {
          const { data: pPub } = supabase.storage.from("route-thumbnails").getPublicUrl(photoPath);
          await supabase
            .from("routes")
            .update({ thumbnail_url: pPub.publicUrl } as never)
            .eq("id", id);
        }
      }

      router.push(`/rotalar/${id}`);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : L("Kayıt sırasında hata oluştu.", "Something went wrong while saving."));
      setSaving(false);
    }
  }

  return (
    <form className="rf" onSubmit={handleSubmit(onSubmit)}>
      {/* Rota kaynağı seçimi */}
      <div className="rf-block">
        <label className="rf-label">{L("Rota kaynağı", "Route source")}</label>
        <div className="chips">
          <button type="button" className={`chip${mode === "gpx" ? " active" : ""}`} onClick={() => setMode("gpx")}>
            {L("GPX dosyası yükle", "Upload a GPX file")}
          </button>
          <button type="button" className={`chip${mode === "draw" ? " active" : ""}`} onClick={() => setMode("draw")}>
            {L("🖊 Haritada çiz", "🖊 Draw on the map")}
          </button>
          <Link href="/kayit" className="chip btn-rec">
            {L("Sürüşünü kaydet (GPS)", "Record your ride (GPS)")}
          </Link>
        </div>
      </div>

      {mode === "gpx" ? (
        <>
          {/* GPX upload */}
          <div className="rf-block">
            <label className="rf-label">{L("GPX dosyası", "GPX file")}</label>
            <label className="gpx-drop">
              <input type="file" accept=".gpx,application/gpx+xml,application/xml" onChange={onFile} hidden />
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 15V3M7 8l5-5 5 5" /><path d="M5 15v4a2 2 0 002 2h10a2 2 0 002-2v-4" />
              </svg>
              <span>{fileName || L("GPX dosyanı seç veya buraya sürükle", "Choose your GPX or drop it here")}</span>
            </label>
            {parseError && <p className="field-error">{parseError}</p>}

            {gpx && (
              <div className="gpx-stats">
                <div><span>{L("Mesafe", "Distance")}</span><b>{km(gpx.distanceM)} km</b></div>
                <div><span>{L("İrtifa", "Elevation")}</span><b>↑ {gpx.elevationGainM.toLocaleString("tr-TR")} m</b></div>
                <div><span>{L("Süre", "Time")}</span><b>{gpx.durationMin ? formatDuration(gpx.durationMin) : "—"}</b></div>
                <div><span>Nokta</span><b>{gpx.coords.length}</b></div>
              </div>
            )}
          </div>

          {/* Map preview */}
          {gpx && (
            <div className="rf-block">
              <label className="rf-label">{L("Önizleme", "Preview")}</label>
              {TOKEN ? (
                <div className="rf-map" ref={mapEl} />
              ) : (
                <p className="rf-hint">{L("Harita önizlemesi için Mapbox token gerekli.", "A Mapbox token is required for the preview.")}</p>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="rf-block">
          <label className="rf-label">{L("Rotanı çiz — haritaya tıklayarak nokta ekle", "Draw your route — click the map to add points")}</label>
          {TOKEN ? (
            <RouteDrawMap lang={lang} points={drawn} onAdd={(p) => setDrawn((d) => [...d, p])} />
          ) : (
            <p className="rf-hint">{L("Harita için Mapbox token gerekli.", "A Mapbox token is required for the map.")}</p>
          )}
          <div className="draw-tools">
            <button type="button" className="chip" onClick={() => setDrawn((d) => d.slice(0, -1))} disabled={!drawn.length}>
              ↶ {L("Geri al", "Undo")}
            </button>
            <button type="button" className="chip" onClick={() => setDrawn([])} disabled={!drawn.length}>
              {L("Temizle", "Clear")}
            </button>
            <span className="draw-stat">
              <b>{km(drawDistM)}</b> km · {drawn.length} {L("nokta", "points")}
            </span>
          </div>
          <label className="field" style={{ marginTop: 12 }}>
            <span>{L("Toplam tırmanış (metre, opsiyonel)", "Total climb (metres, optional)")}</span>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={drawElev}
              onChange={(e) => setDrawElev(e.target.value)}
            />
          </label>
          <p className="rf-hint">{L("Süre, rota türüne ve mesafeye göre otomatik tahmin edilir.", "Time is estimated from route type and distance.")}</p>
        </div>
      )}

      {/* Photo (optional) */}
      <div className="rf-block">
        <label className="rf-label">{L("Fotoğraf (opsiyonel)", "Photo (optional)")}</label>
        <label className="gpx-drop photo-drop">
          <input type="file" accept="image/*" onChange={onPhoto} hidden />
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoPreview} alt="Rota fotoğrafı önizleme" className="photo-preview" />
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="10" r="1.6" />
                <path d="M21 15l-4.5-4.5L9 18" />
              </svg>
              <span>{L("Rotandan bir kare ekle — kartlarda görünür", "Add a shot from your ride — shown on cards")}</span>
            </>
          )}
        </label>
        {photoError && <p className="field-error">{photoError}</p>}
      </div>

      {/* Details */}
      <div className="rf-block">
        <label className="field">
          <span>{L("Başlık", "Title")}</span>
          <input placeholder="Kartepe Zirve Tırmanışı" {...register("title")} />
          {errors.title && <em className="field-error">{errors.title.message}</em>}
        </label>
      </div>

      <div className="rf-block">
        <label className="rf-label">{L("Tür", "Type")}</label>
        <div className="chips">
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              className={`chip${routeType === t ? " active" : ""}`}
              onClick={() => setValue("routeType", t, { shouldValidate: true })}
            >
              {typeName(lang, t)}
            </button>
          ))}
        </div>
        {errors.routeType && <em className="field-error">{errors.routeType.message}</em>}
      </div>

      <div className="rf-block">
        <label className="rf-label">{L("Zorluk", "Difficulty")}</label>
        <div className="chips">
          {DIFFS.map((d) => (
            <button
              key={d}
              type="button"
              className={`chip d-${DIFFICULTY[d].className}${difficulty === d ? " active" : ""}`}
              onClick={() => setValue("difficulty", d, { shouldValidate: true })}
            >
              {diffName(lang, d)}
            </button>
          ))}
        </div>
        {errors.difficulty && <em className="field-error">{errors.difficulty.message}</em>}
      </div>

      <div className="rf-block">
        <label className="field">
          <span>{L("İl", "Region")}</span>
          <input placeholder="Kocaeli" {...register("province")} />
          {errors.province && <em className="field-error">{errors.province.message}</em>}
        </label>
      </div>

      <div className="rf-block">
        <label className="field">
          <span>{L("Açıklama (opsiyonel)", "Description (optional)")}</span>
          <textarea rows={4} placeholder={L("Rota hakkında notlar, dikkat edilecekler…", "Notes about the route, things to watch for…")} {...register("description")} />
        </label>
      </div>

      {submitError && <p className="field-error">{submitError}</p>}

      <button className="btn btn-primary" type="submit" disabled={saving} style={{ justifyContent: "center" }}>
        {saving ? L("Kaydediliyor…", "Saving…") : L("Rotayı yayınla", "Publish route")}
      </button>
    </form>
  );
}
