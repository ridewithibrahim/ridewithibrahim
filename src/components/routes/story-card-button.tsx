"use client";

import { useState } from "react";
import { t as tt, type Lang } from "@/lib/i18n";

const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// --- Google polyline kodlaması (statik harita URL'i için) ---
function encodeNumber(num: number) {
  let n = num < 0 ? ~(num << 1) : num << 1;
  let s = "";
  while (n >= 0x20) {
    s += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
    n >>= 5;
  }
  return s + String.fromCharCode(n + 63);
}
function encodePolyline(coords: [number, number][]) {
  let lat = 0,
    lng = 0,
    res = "";
  for (const [x, y] of coords) {
    const la = Math.round(y * 1e5);
    const ln = Math.round(x * 1e5);
    res += encodeNumber(la - lat) + encodeNumber(ln - lng);
    lat = la;
    lng = ln;
  }
  return res;
}
function downsample(pts: [number, number][], max = 90) {
  if (pts.length <= max) return pts;
  const step = (pts.length - 1) / (max - 1);
  const out: [number, number][] = [];
  for (let i = 0; i < max; i++) out.push(pts[Math.round(i * step)]);
  return out;
}

function roundedPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Görsel yüklenemedi"));
    img.src = src;
  });
}

export function StoryCardButton({
  title,
  province,
  stats,
  diffLabel,
  diffColor,
  coords,
  photoUrl,
  lang = "tr",
}: {
  title: string;
  province: string;
  stats: string;
  diffLabel: string;
  diffColor: string;
  coords: [number, number][];
  photoUrl?: string | null;
  lang?: Lang;
}) {
  const [busy, setBusy] = useState(false);

  async function generate() {
    if (!TOKEN || coords.length < 2 || busy) return;
    setBusy(true);
    try {
      // 1) Görsel: rota fotoğrafı varsa o, yoksa (ya da yüklenemezse) rota çizgili harita
      let img: HTMLImageElement | null = null;
      if (photoUrl) {
        try {
          img = await loadImage(photoUrl);
        } catch {
          img = null; // fotoğraf açılamadı → haritaya düş
        }
      }
      if (!img) {
        const poly = encodeURIComponent(encodePolyline(downsample(coords)));
        const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/path-6+F2B14C-0.95(${poly})/auto/500x500@2x?padding=60&access_token=${TOKEN}`;
        img = await loadImage(mapUrl);
      }

      // 2) 1080x1920 hikâye tuvali
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d")!;
      const fam = getComputedStyle(document.body).fontFamily || "sans-serif";

      ctx.fillStyle = "#0C1512";
      ctx.fillRect(0, 0, 1080, 1920);

      // üst başlık
      ctx.fillStyle = "#F2B14C";
      ctx.font = `800 46px ${fam}`;
      ctx.textAlign = "center";
      ctx.fillText("🚴 RideWithIbrahim", 540, 130);

      // harita (yuvarlatılmış çerçeve içinde)
      ctx.save();
      roundedPath(ctx, 40, 190, 1000, 1000, 30);
      ctx.clip();
      {
        // görseli kare alana orantılı kırparak yerleştir (cover)
        const scale = Math.max(1000 / img.width, 1000 / img.height);
        const sw = 1000 / scale;
        const sh = 1000 / scale;
        const sx = (img.width - sw) / 2;
        const sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, 40, 190, 1000, 1000);
      }
      ctx.restore();
      ctx.strokeStyle = "rgba(242,177,76,.35)";
      ctx.lineWidth = 3;
      roundedPath(ctx, 40, 190, 1000, 1000, 30);
      ctx.stroke();

      // rota başlığı (gerekirse 2 satıra böl)
      ctx.fillStyle = "#F4F7F5";
      ctx.font = `800 64px ${fam}`;
      const words = title.split(" ");
      let line1 = "",
        line2 = "";
      for (const w of words) {
        const test = line1 ? line1 + " " + w : w;
        if (ctx.measureText(test).width <= 980 && !line2) line1 = test;
        else line2 = line2 ? line2 + " " + w : w;
      }
      if (ctx.measureText(line2).width > 980) line2 = line2.slice(0, 28) + "…";
      ctx.fillText(line1, 540, 1300);
      if (line2) ctx.fillText(line2, 540, 1380);

      // il
      ctx.fillStyle = "#9fb3ab";
      ctx.font = `500 42px ${fam}`;
      ctx.fillText(`📍 ${province}`, 540, line2 ? 1460 : 1390);

      // zorluk rozeti + istatistikler
      const rowY = line2 ? 1580 : 1520;
      ctx.font = `700 40px ${fam}`;
      const pillW = ctx.measureText(diffLabel).width + 60;
      ctx.strokeStyle = diffColor;
      ctx.lineWidth = 3;
      roundedPath(ctx, 540 - pillW / 2, rowY - 48, pillW, 68, 34);
      ctx.stroke();
      ctx.fillStyle = diffColor;
      ctx.fillText(diffLabel, 540, rowY);

      ctx.fillStyle = "#F4F7F5";
      ctx.font = `700 48px ${fam}`;
      ctx.fillText(stats, 540, rowY + 110);

      // alt bilgi
      ctx.fillStyle = "#F2B14C";
      ctx.font = `700 40px ${fam}`;
      ctx.fillText("ridewithibrahim.com", 540, 1830);

      // 3) paylaş ya da indir
      const blob: Blob = await new Promise((res, rej) =>
        canvas.toBlob((b) => (b ? res(b) : rej(new Error("Görsel oluşturulamadı"))), "image/png"),
      );
      const file = new File([blob], "rota-hikaye.png", { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch {
          /* kullanıcı menüyü kapattı */
        }
      } else {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "rota-hikaye.png";
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch {
      alert("Hikâye kartı oluşturulamadı — tekrar dener misin?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={generate} disabled={busy}>
      {busy ? tt(lang, "preparing") : tt(lang, "story_card")}
    </button>
  );
}
