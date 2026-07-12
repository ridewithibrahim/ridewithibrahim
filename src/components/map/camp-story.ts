// Kamp noktası için atmosferik hikâye kartı (1080x1920) — tarayıcıda canvas ile çizilir.
import type { Lang } from "@/lib/i18n";

export async function shareCampStory({
  name,
  desc,
  lang = "tr",
}: {
  name: string;
  desc?: string;
  lang?: Lang;
}): Promise<void> {
  const L = (tr: string, en: string) => (lang === "en" ? en : tr);
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const fam = getComputedStyle(document.body).fontFamily || "sans-serif";

  // --- gökyüzü ---
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#070e1a");
  sky.addColorStop(0.5, "#0a161c");
  sky.addColorStop(1, "#0c1512");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // yıldızlar
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * W;
    const y = Math.random() * H * 0.5;
    const b = 130 + Math.random() * 110;
    ctx.fillStyle = `rgb(${b},${b},${Math.min(255, b + 10)})`;
    const r = Math.random() < 0.85 ? 1.4 : 2.4;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // ay + hale
  const mx = 820, my = 330, mr = 68;
  const halo = ctx.createRadialGradient(mx, my, mr * 0.6, mx, my, mr * 3.2);
  halo.addColorStop(0, "rgba(200,215,210,0.35)");
  halo.addColorStop(1, "rgba(200,215,210,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(mx - mr * 3.2, my - mr * 3.2, mr * 6.4, mr * 6.4);
  ctx.fillStyle = "#e2e7e1";
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#cdd4ce";
  [[+18, -10, 12], [-22, +16, 9], [+2, +28, 7]].forEach(([dx, dy, r]) => {
    ctx.beginPath();
    ctx.arc(mx + dx, my + dy, r, 0, Math.PI * 2);
    ctx.fill();
  });

  // --- sisli sırtlar ---
  const ridge = (baseY: number, amp: number, col: string) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, baseY);
    for (let x = 0; x <= W; x += 36) {
      ctx.lineTo(x, baseY + Math.sin(x / 210 + baseY) * amp + (Math.random() - 0.5) * 34);
    }
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
  };
  ridge(H * 0.5, 55, "#101e22");
  ridge(H * 0.56, 46, "#0d191b");
  ridge(H * 0.63, 38, "#0b1516");

  // çamlar
  const pine = (cx: number, base: number, s: number) => {
    ctx.fillStyle = "#070d0c";
    for (let i = 0; i < 3; i++) {
      const w = s * [1, 0.78, 0.55][i];
      const topY = base - s * 0.35 * i - s * [0.42, 0.36, 0.3][i];
      ctx.beginPath();
      ctx.moveTo(cx - w / 2, base - s * 0.35 * i);
      ctx.lineTo(cx + w / 2, base - s * 0.35 * i);
      ctx.lineTo(cx, topY);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillRect(cx - s * 0.05, base, s * 0.1, s * 0.12);
  };
  const gy = H * 0.74;
  pine(85, gy + 8, 150);
  pine(195, gy + 22, 105);
  pine(990, gy, 165);
  pine(885, gy + 18, 112);

  // zemin
  ctx.fillStyle = "#09100d";
  ctx.beginPath();
  ctx.moveTo(0, gy + 22);
  ctx.lineTo(W, gy - 8);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  ctx.fill();

  // --- çadır (ışıltılı) ---
  const tx = 415, tb = H * 0.815, ts = 235;
  const tg = ctx.createRadialGradient(tx, tb - 40, 20, tx, tb - 40, 240);
  tg.addColorStop(0, "rgba(240,170,70,0.5)");
  tg.addColorStop(1, "rgba(240,170,70,0)");
  ctx.fillStyle = tg;
  ctx.fillRect(tx - 260, tb - 300, 520, 380);
  ctx.fillStyle = "#0f1814";
  ctx.strokeStyle = "#283a30";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(tx - ts / 2, tb);
  ctx.lineTo(tx + ts / 2, tb);
  ctx.lineTo(tx, tb - ts + 58);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#eea640";
  ctx.beginPath();
  ctx.moveTo(tx - 56, tb);
  ctx.lineTo(tx + 56, tb);
  ctx.lineTo(tx, tb - 122);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#facd78";
  ctx.beginPath();
  ctx.moveTo(tx - 36, tb);
  ctx.lineTo(tx + 36, tb);
  ctx.lineTo(tx, tb - 92);
  ctx.closePath();
  ctx.fill();

  // --- ateş ---
  const fx = 695, fy = tb + 6;
  const fg = ctx.createRadialGradient(fx, fy - 12, 6, fx, fy - 12, 120);
  fg.addColorStop(0, "rgba(250,150,50,0.55)");
  fg.addColorStop(1, "rgba(250,150,50,0)");
  ctx.fillStyle = fg;
  ctx.fillRect(fx - 130, fy - 140, 260, 200);
  ctx.strokeStyle = "#261c12";
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(fx - 32, fy + 14); ctx.lineTo(fx + 28, fy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(fx - 26, fy + 2); ctx.lineTo(fx + 32, fy + 16); ctx.stroke();
  const flames: [number, number, number, string][] = [
    [0, -14, 15, "#f49632"], [-7, -25, 10, "#fabe5a"], [5, -34, 6, "#fcd682"],
  ];
  flames.forEach(([dx, dy, r, c]) => {
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.arc(fx + dx, fy + dy, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = "#fac46e";
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.arc(fx + (Math.random() - 0.5) * 50, fy - 36 - Math.random() * 110, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // --- metin ---
  ctx.textAlign = "center";
  ctx.fillStyle = "#f4f7f5";
  ctx.font = `800 46px ${fam}`;
  ctx.fillText("🚴 RideWithIbrahim", 540, 130);

  ctx.fillStyle = "#5FB8A3";
  ctx.font = `800 42px ${fam}`;
  ctx.fillText(L("⛺ KAMP NOKTASI", "⛺ CAMP SPOT"), 540, 470);

  // isim: sığdır + gerekirse iki satır
  let size = 88;
  ctx.font = `800 ${size}px ${fam}`;
  while (ctx.measureText(name).width > 1600 && size > 48) {
    size -= 4;
    ctx.font = `800 ${size}px ${fam}`;
  }
  ctx.fillStyle = "#f4f7f5";
  if (ctx.measureText(name).width <= 940) {
    ctx.fillText(name, 540, 580);
  } else {
    const words = name.split(" ");
    let l1 = "", l2 = "";
    for (const w of words) {
      if (ctx.measureText(l1 + " " + w).width <= 900 && !l2) l1 = (l1 + " " + w).trim();
      else l2 = (l2 + " " + w).trim();
    }
    while (ctx.measureText(l2).width > 900 && size > 44) {
      size -= 4;
      ctx.font = `800 ${size}px ${fam}`;
    }
    ctx.fillText(l1, 540, 570);
    ctx.fillText(l2, 540, 570 + size + 12);
  }

  if (desc) {
    ctx.fillStyle = "#b2c3bc";
    ctx.font = `500 40px ${fam}`;
    let dl = desc;
    while (ctx.measureText(dl).width > 920 && dl.length > 4) dl = dl.slice(0, -2);
    ctx.fillText(dl, 540, 760);
  }

  ctx.fillStyle = "#f4f7f5";
  ctx.font = `700 38px ${fam}`;
  ctx.fillText(L("500 kamp noktası haritada", "500 camp spots on the map"), 540, 1755);
  ctx.fillStyle = "#F2B14C";
  ctx.font = `700 42px ${fam}`;
  ctx.fillText("ridewithibrahim.com/harita", 540, 1830);

  // --- paylaş / indir ---
  const blob: Blob = await new Promise((res, rej) =>
    canvas.toBlob((b) => (b ? res(b) : rej(new Error("olusturulamadi"))), "image/png"),
  );
  const file = new File([blob], "kamp-hikaye.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
    } catch {
      /* menü kapatıldı */
    }
  } else {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "kamp-hikaye.png";
    a.click();
    URL.revokeObjectURL(a.href);
  }
}
