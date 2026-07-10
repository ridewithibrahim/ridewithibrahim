import { cookies, headers } from "next/headers";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";

/**
 * Aktif dili belirler — öncelik sırası:
 * 1) Kullanıcının elle seçimi (çerez) — her zaman kazanır
 * 2) Tarayıcı dili Türkçe ise → tr (yurtdışındaki Türkler dahil)
 * 3) Türkiye'den bağlanıyorsa → tr (Vercel ülke başlığı)
 * 4) Aksi halde → en (yabancı ziyaretçi İngilizce karşılanır)
 */
export async function getLang(): Promise<Lang> {
  const c = (await cookies()).get(LANG_COOKIE)?.value;
  if (c === "en") return "en";
  if (c === "tr") return "tr";

  const h = await headers();

  const accept = (h.get("accept-language") ?? "").toLowerCase();
  if (accept.startsWith("tr") || accept.includes(",tr") || accept.includes(";tr") || accept.includes("tr-tr")) {
    return "tr";
  }

  const country = h.get("x-vercel-ip-country");
  if (country === "TR") return "tr";

  if (accept) return "en";
  return "tr"; // hiçbir sinyal yoksa güvenli varsayılan
}
