// ============================================================
// Rota Kapak Üretici — RideWithIbrahim
// @arsiv rotalarına uydu görüntülü, rota çizgili kapak ekler.
//   node scripts/rota-kapaklari.mjs --dry            → sadece listeler
//   node scripts/rota-kapaklari.mjs                  → kapaksızlara üretir
//   node scripts/rota-kapaklari.mjs --force          → hepsini yeniden üretir
//   node scripts/rota-kapaklari.mjs --style dark     → koyu harita stili (varsayılan: uydu)
// Gereksinim: .env.local içinde ARSIV_EMAIL / ARSIV_PASSWORD
// ============================================================

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const ARGS = process.argv.slice(2);
const DRY = ARGS.includes("--dry");
const FORCE = ARGS.includes("--force");
const STYLE =
  ARGS[ARGS.indexOf("--style") + 1] === "dark" ? "mapbox/dark-v11" : "mapbox/satellite-streets-v12";

const env = {};
for (const line of readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)\s*=\s*(.+)\s*$/);
  if (m) env[m[1]] = m[2].trim();
}
const TOKEN = env.NEXT_PUBLIC_MAPBOX_TOKEN;
if (!TOKEN) { console.error("❌ NEXT_PUBLIC_MAPBOX_TOKEN eksik."); process.exit(1); }
if (!env.ARSIV_EMAIL || !env.ARSIV_PASSWORD) {
  console.error("❌ .env.local içine ARSIV_EMAIL ve ARSIV_PASSWORD ekle.");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- polyline kodlaması ---
function encodeNumber(num) {
  let n = num < 0 ? ~(num << 1) : num << 1;
  let s = "";
  while (n >= 0x20) { s += String.fromCharCode((0x20 | (n & 0x1f)) + 63); n >>= 5; }
  return s + String.fromCharCode(n + 63);
}
function encodePolyline(coords) {
  let lat = 0, lng = 0, res = "";
  for (const [x, y] of coords) {
    const la = Math.round(y * 1e5), ln = Math.round(x * 1e5);
    res += encodeNumber(la - lat) + encodeNumber(ln - lng);
    lat = la; lng = ln;
  }
  return res;
}
function downsample(pts, max = 90) {
  if (pts.length <= max) return pts;
  const step = (pts.length - 1) / (max - 1);
  const out = [];
  for (let i = 0; i < max; i++) out.push(pts[Math.round(i * step)]);
  return out;
}

async function main() {
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: env.ARSIV_EMAIL,
    password: env.ARSIV_PASSWORD,
  });
  if (authErr) { console.error("❌ Giriş hatası:", authErr.message); process.exit(1); }
  const uid = auth.user.id;

  const { data: routes, error } = await supabase
    .from("routes")
    .select("id, title, thumbnail_url, path")
    .eq("user_id", uid)
    .order("created_at", { ascending: true });
  if (error) { console.error("❌ Rotalar okunamadı:", error.message); process.exit(1); }

  const todo = (routes ?? []).filter((r) => FORCE || !r.thumbnail_url);
  console.log(`🖼  ${routes?.length ?? 0} rota bulundu; ${todo.length} tanesine kapak üretilecek. Stil: ${STYLE}\n`);

  if (DRY) {
    for (const r of todo) console.log("  •", r.title);
    console.log("\n🔎 Kuru çalıştırma — hiçbir şey üretilmedi.");
    return;
  }

  let ok = 0;
  for (const r of todo) {
    try {
      const coords = r.path?.coordinates;
      if (!coords || coords.length < 2) { console.log(`  ⤬ atlandı (çizgi yok): ${r.title}`); continue; }

      const poly = encodeURIComponent(encodePolyline(downsample(coords)));
      const url =
        `https://api.mapbox.com/styles/v1/${STYLE}/static/` +
        `path-5+F2B14C-0.95(${poly})/auto/800x500@2x?padding=60&access_token=${TOKEN}`;

      const res = await fetch(url, { headers: { Referer: "https://ridewithibrahim.com" } });
      if (!res.ok) { console.log(`  ✗ görsel alınamadı (${res.status}): ${r.title}`); continue; }
      const buf = new Uint8Array(await res.arrayBuffer());

      const storagePath = `${uid}/kapak-${r.id}.png`;
      const { error: upErr } = await supabase.storage
        .from("route-thumbnails")
        .upload(storagePath, buf, { contentType: "image/png", upsert: true });
      if (upErr) { console.log(`  ✗ yüklenemedi: ${r.title} — ${upErr.message}`); continue; }

      const pub = supabase.storage.from("route-thumbnails").getPublicUrl(storagePath).data.publicUrl;
      const { error: updErr } = await supabase
        .from("routes")
        .update({ thumbnail_url: pub })
        .eq("id", r.id);
      if (updErr) { console.log(`  ✗ kaydedilemedi: ${r.title} — ${updErr.message}`); continue; }

      ok++;
      console.log(`  ✓ ${r.title}`);
      await sleep(350); // Mapbox'a nazik davran
    } catch (e) {
      console.log(`  ✗ hata: ${r.title} — ${e.message}`);
    }
  }
  console.log(`\n🎉 Bitti: ${ok}/${todo.length} rotaya kapak eklendi. Siteyi yenile, kartlara bak!`);
}

main().catch((e) => { console.error("Beklenmedik hata:", e.message); process.exit(1); });
