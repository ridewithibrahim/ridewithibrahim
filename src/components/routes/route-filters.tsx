"use client";

import { useCallback, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ROUTE_TYPES, DIFFICULTY } from "@/lib/types";

const TYPES = ["yol", "mtb", "moto", "kamp"] as const;
const DIFFS = ["kolay", "orta", "zor", "uzman"] as const;
const DISTANCES: { key: string; label: string }[] = [
  { key: "0-25", label: "0–25 km" },
  { key: "25-50", label: "25–50 km" },
  { key: "50-100", label: "50–100 km" },
  { key: "100+", label: "100+ km" },
];

export function RouteFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = useCallback(
    (key: string, value?: string) => {
      const next = new URLSearchParams(params.toString());
      // toggle off if the same value is clicked again
      if (!value || next.get(key) === value) next.delete(key);
      else next.set(key, value);
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const onProvince = (value: string) => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (value.trim()) next.set("il", value.trim());
      else next.delete("il");
      const qs = next.toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 350);
  };

  const active = (key: string, val: string) => params.get(key) === val;
  const hasAny = ["tur", "zorluk", "mesafe", "il"].some((k) => params.get(k));

  return (
    <div className="rfilters">
      <div className="fgroup">
        <span className="lbl">Tür</span>
        {TYPES.map((t) => (
          <button key={t} className={`chip${active("tur", t) ? " active" : ""}`} onClick={() => setParam("tur", t)}>
            {ROUTE_TYPES[t].label}
          </button>
        ))}
      </div>

      <div className="fgroup">
        <span className="lbl">Zorluk</span>
        {DIFFS.map((d) => (
          <button key={d} className={`chip d-${DIFFICULTY[d].className}${active("zorluk", d) ? " active" : ""}`} onClick={() => setParam("zorluk", d)}>
            {DIFFICULTY[d].label}
          </button>
        ))}
      </div>

      <div className="fgroup">
        <span className="lbl">Mesafe</span>
        {DISTANCES.map((m) => (
          <button key={m.key} className={`chip${active("mesafe", m.key) ? " active" : ""}`} onClick={() => setParam("mesafe", m.key)}>
            {m.label}
          </button>
        ))}
      </div>

      <div className="fgroup">
        <span className="lbl">İl</span>
        <input
          className="il-input"
          placeholder="İl ara…"
          defaultValue={params.get("il") ?? ""}
          onChange={(e) => onProvince(e.target.value)}
        />
        {hasAny && (
          <button className="chip clear" onClick={() => router.push(pathname, { scroll: false })}>
            Temizle ✕
          </button>
        )}
      </div>
    </div>
  );
}
