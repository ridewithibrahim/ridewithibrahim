// ============================================================
// OSM Rota İçe Aktarma Aracı — RideWithIbrahim
// Çalıştırma:
//   node scripts/osm-import.mjs --dry          → sadece listeler (yüklemez)
//   node scripts/osm-import.mjs --limit 25     → en iyi 25 rotayı yükler
// Gereksinim: .env.local içinde ARSIV_EMAIL ve ARSIV_PASSWORD
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

// ---------- ayarlar ----------
const ARGS = process.argv.slice(2);
const DRY = ARGS.includes("--dry");
const ONLY_MTB = ARGS.includes("--mtb"); // sadece MTB rotalarını al
const LIMIT = Number(ARGS[ARGS.indexOf("--limit") + 1]) || 25;
const MIN_KM = Number(ARGS[ARGS.indexOf("--min") + 1]) || 15;
const MAX_KM = Number(ARGS[ARGS.indexOf("--max") + 1]) || 250;
const areaIdx = ARGS.indexOf("--area");
const AREA = areaIdx >= 0 ? (ARGS[areaIdx + 1] || "TR").toUpperCase() : "TR"; // ISO ülke kodu
const ONLY_NCN = ARGS.includes("--ncn"); // sadece ulusal rota ağı (LF/EuroVelo tarzı)

// ---------- .env.local oku ----------
const env = {};
try {
  for (const line of readFileSync(".env.local", "utf8").split("\n")) {
    const m = line.match(/^([A-Z_]+)\s*=\s*(.+)\s*$/);
    if (m) env[m[1]] = m[2].trim();
  }
} catch {
  console.error("❌ .env.local bulunamadı — proje kökünde çalıştır.");
  process.exit(1);
}
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!SB_URL || !SB_KEY) {
  console.error("❌ Supabase env değişkenleri eksik.");
  process.exit(1);
}
if (!DRY && (!env.ARSIV_EMAIL || !env.ARSIV_PASSWORD)) {
  console.error("❌ .env.local dosyasına ARSIV_EMAIL ve ARSIV_PASSWORD ekle (arşiv hesabının girişi).");
  process.exit(1);
}

// ---------- yardımcılar ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function havKm(a, b) {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[1] * Math.PI) / 180) * Math.cos((b[1] * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
const lineKm = (pts) => {
  let s = 0;
  for (let i = 1; i < pts.length; i++) s += havKm(pts[i - 1], pts[i]);
  return s;
};
const near = (a, b) => Math.abs(a[0] - b[0]) < 0.0008 && Math.abs(a[1] - b[1]) < 0.0008;

// Parçalı way'leri uç uca ekleyerek tek çizgi kur
function assemble(segments) {
  const segs = segments.filter((s) => s.length >= 2).map((s) => [...s]);
  if (!segs.length) return null;
  const total = segs.reduce((t, s) => t + lineKm(s), 0);
  let chain = segs.shift();
  let grew = true;
  while (grew && segs.length) {
    grew = false;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const cS = chain[0], cE = chain[chain.length - 1];
      if (near(cE, s[0])) chain = chain.concat(s.slice(1));
      else if (near(cE, s[s.length - 1])) chain = chain.concat([...s].reverse().slice(1));
      else if (near(cS, s[s.length - 1])) chain = s.slice(0, -1).concat(chain);
      else if (near(cS, s[0])) chain = [...s].reverse().slice(0, -1).concat(chain);
      else continue;
      segs.splice(i, 1);
      grew = true;
      break;
    }
  }
  const covered = lineKm(chain);
  return { coords: chain, coverage: total > 0 ? covered / total : 0 };
}

function downsample(pts, max = 400) {
  if (pts.length <= max) return pts;
  const step = (pts.length - 1) / (max - 1);
  const out = [];
  for (let i = 0; i < max; i++) out.push(pts[Math.round(i * step)]);
  return out;
}

function difficulty(type, distKm, gainM) {
  if (type === "mtb") {
    if (distKm > 60 || gainM > 1500) return "uzman";
    if (distKm > 35 || gainM > 800) return "zor";
    if (distKm < 15 && gainM < 250) return "kolay";
    return "orta";
  }
  if (distKm > 130 || gainM > 2200) return "uzman";
  if (distKm > 75 || gainM > 1200) return "zor";
  if (distKm < 25 && gainM < 300) return "kolay";
  return "orta";
}

// ---------- 1) Overpass: Türkiye'deki isimli bisiklet/MTB rotaları ----------
const OVERPASS_SERVERS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

async function fetchOsmRoutes() {
  console.log(`🌍 OpenStreetMap sorgulanıyor — bölge: ${AREA}${ONLY_NCN ? " (yalnız ulusal ağ)" : ""} (1-2 dk sürebilir)…`);
  const netFilter = ONLY_NCN ? '["network"="ncn"]' : "";
  const query = `
[out:json][timeout:180];
area["ISO3166-1"="${AREA}"][admin_level=2]->.a;
relation["route"~"^(bicycle|mtb)$"]${netFilter}["name"](area.a);
out body geom;`;

  let lastErr = "";
  for (const server of OVERPASS_SERVERS) {
    try {
      const res = await fetch(server, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "User-Agent": "RideWithIbrahim-Import/1.0 (mail@ridewithibrahim.com)",
          Accept: "application/json",
        },
        body: "data=" + encodeURIComponent(query),
      });
      if (!res.ok) {
        lastErr = `${server} → HTTP ${res.status}`;
        continue;
      }
      const json = await res.json();
      return json.elements ?? [];
    } catch (e) {
      lastErr = `${server} → ${e.message}`;
    }
  }
  throw new Error("Overpass hatası: " + lastErr);
}

// ---------- 2) İrtifa: open-elevation ----------
async function elevationGain(coords) {
  try {
    const sample = downsample(coords, 70).map(([lng, lat]) => ({ latitude: lat, longitude: lng }));
    const res = await fetch("https://api.open-elevation.com/api/v1/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locations: sample }),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    const els = (json.results ?? []).map((r) => r.elevation);
    let gain = 0;
    for (let i = 1; i < els.length; i++) {
      const d = els[i] - els[i - 1];
      if (d > 5) gain += d; // küçük gürültüyü ele
    }
    return Math.round(gain);
  } catch {
    return 0;
  }
}

// ---------- 3) İl: Nominatim ters geokod (TR içindeki noktayı tercih et) ----------
async function reverseOnce([lng, lat]) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=6&accept-language=tr`,
      { headers: { "User-Agent": "RideWithIbrahim-Import/1.0 (mail@ridewithibrahim.com)" } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return {
      cc: json.address?.country_code,
      name: (json.address?.province || json.address?.state || "")
        .replace(/\s*\((il|ili)\)\s*/gi, "")
        .replace(/\s+(ili?)$/i, "")
        .trim(),
    };
  } catch {
    return null;
  }
}

async function findProvince(coords) {
  const picks = [coords[0], coords[Math.floor(coords.length / 2)], coords[coords.length - 1]];
  let firstAny = "";
  for (const p of picks) {
    const r = await reverseOnce(p);
    await sleep(1100); // Nominatim: saniyede 1 istek
    if (!r) continue;
    if (r.cc === "tr" && r.name) return r.name; // Türkiye'deki nokta öncelikli
    if (!firstAny && r.name) firstAny = r.name;
  }
  return firstAny || "Türkiye";
}

// ---------- ana akış ----------
const rank = (tags) =>
  ({ icn: 0, ncn: 1, rcn: 2 }[tags.network] ?? 3); // uluslararası > ulusal > bölgesel > diğer

async function main() {
  const rels = await fetchOsmRoutes();
  console.log(`   ${rels.length} rota ilişkisi bulundu, eleniyor…`);

  const seen = new Set();
  const candidates = [];
  for (const rel of rels) {
    const name = rel.tags?.name
      ?.replace(/\[[^\]]*\]/g, "") // [Paylaşımlı] [??] gibi artıkları temizle
      .replace(/\s+/g, " ")
      .trim();
    if (!name || seen.has(name.toLowerCase())) continue;
    const segs = (rel.members ?? [])
      .filter((m) => m.type === "way" && m.geometry)
      .map((m) => m.geometry.map((g) => [g.lon, g.lat]));
    const asm = assemble(segs);
    if (!asm || asm.coverage < 0.7) continue; // kopuk rotaları ele
    const distKm = lineKm(asm.coords);
    const isMtb = rel.tags.route === "mtb";
    if (ONLY_MTB && !isMtb) continue;
    if (ONLY_NCN && rel.tags.network !== "ncn") continue; // sel önleme: yalnız ulusal ağ
    if (distKm < (isMtb ? 8 : MIN_KM) || distKm > MAX_KM) continue; // MTB parkurları kısa olabilir
    seen.add(name.toLowerCase());
    candidates.push({
      osmId: rel.id,
      name,
      type: rel.tags.route === "mtb" ? "mtb" : "yol",
      coords: downsample(asm.coords),
      distKm,
      rank: rank(rel.tags ?? {}),
      osmDesc: rel.tags?.description ?? "",
    });
  }

  // Sitede zaten olan @arsiv rotalarını ele — tekrar yükleme derdi bitti
  try {
    const sb = createClient(SB_URL, SB_KEY);
    const { data: prof } = await sb
      .from("profiles").select("id").eq("username", "arsiv").maybeSingle();
    if (prof?.id) {
      const { data: existing } = await sb
        .from("routes").select("title").eq("user_id", prof.id).limit(1000);
      const have = new Set((existing ?? []).map((r) => r.title.toLowerCase()));
      const before = candidates.length;
      for (let i = candidates.length - 1; i >= 0; i--) {
        if (have.has(candidates[i].name.toLowerCase())) candidates.splice(i, 1);
      }
      if (before - candidates.length > 0)
        console.log(`   ↺ ${before - candidates.length} rota zaten sitede — atlandı.`);
    }
  } catch { /* okunamazsa eleme yapmadan devam */ }

  candidates.sort((a, b) => a.rank - b.rank || b.distKm - a.distKm);
  const picked = candidates.slice(0, LIMIT);
  console.log(`✅ ${candidates.length} uygun rota; en iyi ${picked.length} tanesi seçildi.\n`);

  // zorluk + il hesapla
  for (const r of picked) {
    r.gainM = await elevationGain(r.coords);
    r.difficulty = difficulty(r.type, r.distKm, r.gainM);
    r.province = await findProvince(r.coords);
    r.durationMin = Math.max(30, Math.round((r.distKm / (r.type === "mtb" ? 14 : 20)) * 60));
    console.log(
      `  • ${r.name}  [${r.type}/${r.difficulty}]  ${r.distKm.toFixed(0)} km  ↑${r.gainM} m  — ${r.province}`,
    );
  }

  if (DRY) {
    console.log("\n🔎 Kuru çalıştırma bitti — hiçbir şey yüklenmedi.");
    console.log("   Liste iyi görünüyorsa:  node scripts/osm-import.mjs --limit " + LIMIT);
    return;
  }

  // Supabase'e @arsiv olarak yükle
  const supabase = createClient(SB_URL, SB_KEY);
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: env.ARSIV_EMAIL,
    password: env.ARSIV_PASSWORD,
  });
  if (authErr) {
    console.error("❌ Arşiv hesabına girilemedi:", authErr.message);
    process.exit(1);
  }

  let ok = 0;
  for (const r of picked) {
    const description =
      (r.osmDesc ? r.osmDesc + "\n\n" : "") +
      `Bu rota OpenStreetMap katkıcılarından aktarılmıştır (ODbL lisansı). ` +
      `Kaynak: openstreetmap.org/relation/${r.osmId}`;
    const { error } = await supabase.rpc("create_route", {
      p_title: r.name,
      p_description: description,
      p_route_type: r.type,
      p_difficulty: r.difficulty,
      p_province: r.province,
      p_distance_m: Math.round(r.distKm * 1000),
      p_elevation_gain_m: r.gainM,
      p_duration_min: r.durationMin,
      p_coords: r.coords,
      p_gpx_url: "",
    });
    if (error) console.error(`  ✗ ${r.name}: ${error.message}`);
    else {
      ok++;
      console.log(`  ✓ yüklendi: ${r.name}`);
    }
    await sleep(400);
  }
  console.log(`\n🎉 Bitti: ${ok}/${picked.length} rota siteye eklendi. ridewithibrahim.com/harita'ya bak!`);
}

main().catch((e) => {
  console.error("Beklenmedik hata:", e.message);
  process.exit(1);
});
