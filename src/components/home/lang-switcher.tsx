"use client";

import { useRouter } from "next/navigation";
import { LANG_COOKIE, type Lang } from "@/lib/i18n";

export function LangSwitcher({ lang }: { lang: Lang }) {
  const router = useRouter();

  function set(l: Lang) {
    if (l === lang) return;
    document.cookie = `${LANG_COOKIE}=${l};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  }

  return (
    <span className="lang-sw" role="group" aria-label="Language / Dil">
      {(["tr", "en"] as const).map((l) => (
        <button key={l} type="button" className={l === lang ? "on" : ""} onClick={() => set(l)}>
          {l.toUpperCase()}
        </button>
      ))}
    </span>
  );
}
