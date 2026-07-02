import type { Database } from "@/types/database.types";

export type RouteType = Database["public"]["Enums"]["route_type"];
export type Difficulty = Database["public"]["Enums"]["difficulty"];

export interface RouteSummary {
  id: string;
  title: string;
  province: string;
  routeType: RouteType;
  difficulty: Difficulty;
  distanceM: number;
  elevationGainM: number;
  durationMin: number;
  likesCount: number;
  thumbnailUrl?: string | null;
  saved?: boolean;
  authorUsername?: string;
}

export interface EventSummary {
  id: string;
  title: string;
  eventType: RouteType;
  location: string;
  startsAt: string; // ISO
  attendeeCount: number;
}

export const ROUTE_TYPES: Record<
  RouteType,
  { label: string; tag: string }
> = {
  yol: { label: "Yol Bisikleti", tag: "Bisiklet · Yol" },
  mtb: { label: "Dağ Bisikleti", tag: "Bisiklet · MTB" },
  moto: { label: "Motosiklet", tag: "Moto · Tur" },
  kamp: { label: "Kamp & Keşif", tag: "Kamp · Keşif" },
};

export const DIFFICULTY: Record<
  Difficulty,
  { label: string; className: string; color: string }
> = {
  kolay: { label: "Kolay", className: "easy", color: "#54B97C" },
  orta: { label: "Orta", className: "mod", color: "#5BA3D0" },
  zor: { label: "Zor", className: "hard", color: "#E2823F" },
  uzman: { label: "Uzman", className: "expert", color: "#D45D49" },
};

// ---------- formatters ----------
export const km = (m: number) =>
  (m / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 });

export const formatDuration = (min: number) => {
  if (min >= 1440) return `${Math.round(min / 1440)}g`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}` : `${m}dk`;
};

export const monthShort = (iso: string) =>
  new Date(iso).toLocaleDateString("tr-TR", { month: "short" }).replace(".", "");

export const dayOfMonth = (iso: string) => new Date(iso).getDate();
