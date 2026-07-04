// Rütbe sistemi — rota sayısı VEYA toplam km ile seviye atlanır.
// Veritabanı gerektirmez; mevcut istatistiklerden anlık hesaplanır.

export interface Rank {
  key: string;
  name: string;
  emoji: string;
  minRoutes: number;
  minKm: number;
}

// Küçükten büyüğe sıralı
export const RANKS: Rank[] = [
  { key: "caylak", name: "Çaylak", emoji: "🌱", minRoutes: 0, minKm: 0 },
  { key: "kasif", name: "Kaşif", emoji: "🧭", minRoutes: 1, minKm: 30 },
  { key: "yol-arkadasi", name: "Yol Arkadaşı", emoji: "🚴", minRoutes: 3, minKm: 100 },
  { key: "rotaci", name: "Rotacı", emoji: "🔥", minRoutes: 7, minKm: 300 },
  { key: "km-avcisi", name: "Kilometre Avcısı", emoji: "⚡", minRoutes: 15, minKm: 750 },
  { key: "efsane", name: "Efsane", emoji: "🏆", minRoutes: 30, minKm: 2000 },
];

/** Mevcut rütbe: rota sayısı VEYA km eşiğini geçen en yüksek seviye. */
export function getRank(routes: number, km: number): Rank {
  let current = RANKS[0];
  for (const r of RANKS) {
    if (routes >= r.minRoutes || km >= r.minKm) {
      if (r.minRoutes === 0 && r.minKm === 0) current = r;
      else if (routes >= r.minRoutes || (r.minKm > 0 && km >= r.minKm)) current = r;
    }
  }
  return current;
}

/** Bir sonraki rütbe ve ona kalan mesafe/rota (profilde teşvik metni için). */
export function getNextRank(
  routes: number,
  km: number,
): { rank: Rank; needRoutes: number; needKm: number } | null {
  const cur = getRank(routes, km);
  const idx = RANKS.findIndex((r) => r.key === cur.key);
  const next = RANKS[idx + 1];
  if (!next) return null;
  return {
    rank: next,
    needRoutes: Math.max(0, next.minRoutes - routes),
    needKm: Math.max(0, Math.ceil(next.minKm - km)),
  };
}

// ---------- Başarı rozetleri ----------
import type { RouteSummary } from "@/lib/types";

export interface Achievement {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  earned: boolean;
}

/** Rozetler — hepsi profildeki mevcut rota verisinden anlık türetilir. */
export function computeBadges(routes: RouteSummary[]): Achievement[] {
  const count = routes.length;
  const totalKm = routes.reduce((s, r) => s + r.distanceM, 0) / 1000;
  const totalLikes = routes.reduce((s, r) => s + r.likesCount, 0);
  const maxClimb = routes.reduce((m, r) => Math.max(m, r.elevationGainM), 0);
  const types = new Set(routes.map((r) => r.routeType));

  return [
    { id: "first", emoji: "🚴", label: "İlk Rota", desc: "İlk rotanı paylaştın", earned: count >= 1 },
    { id: "five", emoji: "🗺️", label: "Haritacı", desc: "5 rota paylaştın", earned: count >= 5 },
    { id: "fifteen", emoji: "🏅", label: "Koleksiyoncu", desc: "15 rota paylaştın", earned: count >= 15 },
    { id: "km100", emoji: "📏", label: "100 km Kulübü", desc: "Toplam 100 km rota paylaştın", earned: totalKm >= 100 },
    { id: "km500", emoji: "🛣️", label: "500 km Kulübü", desc: "Toplam 500 km rota paylaştın", earned: totalKm >= 500 },
    { id: "climb", emoji: "⛰️", label: "Tırmanışçı", desc: "Tek rotada 1.000 m+ tırmanış", earned: maxClimb >= 1000 },
    { id: "loved", emoji: "❤️", label: "Sevilen", desc: "Rotaların toplam 10+ beğeni aldı", earned: totalLikes >= 10 },
    { id: "multi", emoji: "🎒", label: "Çok Yönlü", desc: "En az 3 farklı türde rota paylaştın", earned: types.size >= 3 },
  ];
}
