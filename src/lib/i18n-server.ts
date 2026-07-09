import { cookies } from "next/headers";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";

/** Çerezden aktif dili okur (varsayılan: tr). */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get(LANG_COOKIE)?.value;
  return v === "en" ? "en" : "tr";
}
