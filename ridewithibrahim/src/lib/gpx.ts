export interface ParsedGpx {
  coords: [number, number][]; // [lng, lat]
  elevations: number[]; // per coord (NaN if missing)
  cumulativeM: number[]; // cumulative distance per coord
  distanceM: number;
  elevationGainM: number;
  durationMin: number;
  name?: string;
  hasElevation: boolean;
}

interface Pt {
  lng: number;
  lat: number;
  ele: number;
  time: number;
}

function haversine(a: [number, number], b: [number, number]) {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lon1, lat1] = a;
  const [lon2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function downsample<T>(arr: T[], max = 1200): T[] {
  if (arr.length <= max) return arr;
  const step = Math.ceil(arr.length / max);
  const out = arr.filter((_, i) => i % step === 0);
  if (out[out.length - 1] !== arr[arr.length - 1]) out.push(arr[arr.length - 1]);
  return out;
}

export function parseGpx(xml: string): ParsedGpx {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  if (doc.querySelector("parsererror")) throw new Error("GPX dosyası okunamadı.");

  let raw = Array.from(doc.getElementsByTagName("trkpt"));
  if (!raw.length) raw = Array.from(doc.getElementsByTagName("rtept"));
  if (!raw.length) throw new Error("GPX içinde iz noktası (trkpt) bulunamadı.");

  const pts: Pt[] = [];
  for (const p of raw) {
    const lat = parseFloat(p.getAttribute("lat") ?? "");
    const lng = parseFloat(p.getAttribute("lon") ?? "");
    if (Number.isNaN(lat) || Number.isNaN(lng)) continue;
    const eleTxt = p.getElementsByTagName("ele")[0]?.textContent;
    const timeTxt = p.getElementsByTagName("time")[0]?.textContent;
    pts.push({
      lng,
      lat,
      ele: eleTxt ? parseFloat(eleTxt) : NaN,
      time: timeTxt ? Date.parse(timeTxt) : NaN,
    });
  }
  if (pts.length < 2) throw new Error("Geçerli bir rota için en az 2 nokta gerekli.");

  const sampled = downsample(pts);
  const coords: [number, number][] = sampled.map((p) => [p.lng, p.lat]);
  const elevations = sampled.map((p) => p.ele);

  const cumulativeM: number[] = [0];
  for (let i = 1; i < coords.length; i++) {
    cumulativeM.push(cumulativeM[i - 1] + haversine(coords[i - 1], coords[i]));
  }

  let gain = 0;
  for (let i = 1; i < elevations.length; i++) {
    const d = elevations[i] - elevations[i - 1];
    if (!Number.isNaN(d) && d > 0) gain += d;
  }

  const validTimes = sampled.map((p) => p.time).filter((t) => !Number.isNaN(t));
  const durationMin =
    validTimes.length >= 2
      ? Math.max(Math.round((validTimes[validTimes.length - 1] - validTimes[0]) / 60000), 0)
      : 0;

  return {
    coords,
    elevations,
    cumulativeM,
    distanceM: Math.round(cumulativeM[cumulativeM.length - 1]),
    elevationGainM: Math.round(gain),
    durationMin,
    name: doc.getElementsByTagName("name")[0]?.textContent?.trim() || undefined,
    hasElevation: elevations.some((e) => !Number.isNaN(e)),
  };
}
