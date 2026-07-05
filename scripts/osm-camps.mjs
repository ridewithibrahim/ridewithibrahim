// ============================================================
// OSM Kamp Noktası İçe Aktarma — RideWithIbrahim
//   node scripts/osm-camps.mjs --dry           → sadece listeler
//   node scripts/osm-camps.mjs --limit 150     → yükler
// Gereksinim: .env.local içinde ARSIV_EMAIL / ARSIV_PASSWORD
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ARGS = process.argv.slice(2);
const DRY = ARGS.includes("--dry");
const LIMIT = Number(ARGS[ARGS.indexOf("--limit") + 1]) || 150;

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.+)\s*$/);
  if (m) env[m[1]] = m[2].trim();
}
if (!DRY && (!env.ARSIV_EMAIL || !env.ARSIV_PASSWORD)) {
  console.error("❌ .env.local içine ARSIV_EMAIL ve ARSIV_PASSWORD ekle.");
  process.exit(1);
}

const OVERPASS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

async function fetchCamps() {
  console.log("⛺ OpenStreetMap'te Türkiye kamp alanları aranıyor…");
  const query = `
[out:json][timeout:180];
area["ISO3166-1"="TR"][admin_level=2]->.tr;
nwr["tourism"="camp_site"]["name"](area.tr);
out center tags;`;
  let lastErr = "";
  for (const server of OVERPASS) {
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
      if (!res.ok) { lastErr = `${server} → HTTP ${res.status}`; continue; }
      return (await res.json()).elements ?? [];
    } catch (e) { lastErr = `${server} → ${e.message}`; }
  }
  throw new Error("Overpass hatası: " + lastErr);
}

// --- kalite süzgeci ---
const JUNK_NAME = /parking|otopark|park yeri|wc\b|tuvalet|mezarl|cemetery|picnic|piknik/i;

function qualityScore(tags) {
  let s = 0;
  if (tags.website || tags["contact:website"] || tags.phone || tags["contact:phone"]) s += 2;
  for (const k of ["fee", "drinking_water", "toilets", "shower", "power_supply",
                   "operator", "capacity", "internet_access", "tents", "caravans", "opening_hours"]) {
    if (tags[k] != null) s += 1;
  }
  return s;
}

function describe(tags) {
  const parts = [];
  if (tags.fee === "no") parts.push("Ücretsiz");
  else if (tags.fee === "yes") parts.push("Ücretli");
  if (tags.drinking_water === "yes") parts.push("içme suyu var");
  if (tags.toilets === "yes") parts.push("tuvalet var");
  if (tags.shower === "yes") parts.push("duş var");
  if (tags.power_supply === "yes") parts.push("elektrik var");
  if (tags.tents === "yes") parts.push("çadıra uygun");
  if (tags.caravans === "yes") parts.push("karavana uygun");
  const base = parts.length ? parts.join(" · ") : "";
  const attribution = "Kaynak: OpenStreetMap katkıcıları (ODbL).";
  return base ? `${base}\n\n${attribution}` : attribution;
}

async function main() {
  const els = await fetchCamps();
  console.log(`   ${els.length} kamp alanı bulundu, eleniyor…`);

  const seen = new Set();
  const spots = [];
  for (const el of els) {
    const name = el.tags?.name?.replace(/\s+/g, " ").trim();
    const lat = el.lat ?? el.center?.lat;
    const lng = el.lon ?? el.center?.lon;
    if (!name || lat == null || lng == null) continue;
    if (JUNK_NAME.test(name)) continue; // yanlış etiketlenmişleri ele
    const key = name.toLowerCase() + "|" + lat.toFixed(3) + "|" + lng.toFixed(3);
    if (seen.has(key)) continue;
    seen.add(key);
    spots.push({
      name, lat, lng,
      description: describe(el.tags ?? {}),
      source: "osm",
      score: qualityScore(el.tags ?? {}),
    });
  }

  spots.sort((a, b) => b.score - a.score); // en zengin kayıtlar öne
  const picked = spots.slice(0, LIMIT).map(({ score, ...rest }) => ({ ...rest, score }));
  console.log(`✅ ${spots.length} uygun nokta; en kaliteli ${picked.length} tanesi seçildi.\n`);
  for (const s of picked.slice(0, 40)) console.log(`  • [${"★".repeat(Math.min(s.score, 5)) || "—"}] ${s.name}`);
  if (picked.length > 40) console.log(`  … ve ${picked.length - 40} nokta daha`);

  if (DRY) {
    console.log("\n🔎 Kuru çalıştırma bitti — hiçbir şey yüklenmedi.");
    console.log("   Yüklemek için:  node scripts/osm-camps.mjs --limit " + LIMIT);
    return;
  }

  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: env.ARSIV_EMAIL,
    password: env.ARSIV_PASSWORD,
  });
  if (authErr) { console.error("❌ Giriş hatası:", authErr.message); process.exit(1); }

  let ok = 0;
  for (let i = 0; i < picked.length; i += 50) {
    const chunk = picked.slice(i, i + 50).map(({ score: _s, ...row }) => row);
    const { error } = await supabase.from("camp_spots").insert(chunk);
    if (error) console.error("  ✗ parça hatası:", error.message);
    else { ok += chunk.length; console.log(`  ✓ ${ok}/${picked.length} yüklendi`); }
  }
  console.log(`\n🎉 Bitti: ${ok} kamp noktası eklendi. Haritada ⛺ katmanını aç!`);
}

main().catch((e) => { console.error("Beklenmedik hata:", e.message); process.exit(1); });
