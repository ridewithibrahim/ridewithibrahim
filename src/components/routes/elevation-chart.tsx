"use client";

import { useEffect, useState } from "react";
import { parseGpx, type ParsedGpx } from "@/lib/gpx";
import { km } from "@/lib/types";

const W = 800;
const H = 200;
const PAD = 24;

export function ElevationChart({ gpxUrl }: { gpxUrl: string | null }) {
  const [data, setData] = useState<ParsedGpx | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!gpxUrl) return;
    let ok = true;
    fetch(gpxUrl)
      .then((r) => r.text())
      .then((t) => ok && setData(parseGpx(t)))
      .catch(() => ok && setFailed(true));
    return () => {
      ok = false;
    };
  }, [gpxUrl]);

  if (!gpxUrl || failed) return null;
  if (!data) return <div className="elev-skel" />;
  if (!data.hasElevation) return null;

  const eles = data.elevations;
  const dist = data.cumulativeM;
  const maxDist = dist[dist.length - 1] || 1;
  const valid = eles.filter((e) => !Number.isNaN(e));
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;

  const x = (i: number) => PAD + (dist[i] / maxDist) * (W - PAD * 2);
  const y = (e: number) => H - PAD - ((e - min) / range) * (H - PAD * 2);

  let d = "";
  let lastEle = valid[0];
  eles.forEach((e, i) => {
    const ele = Number.isNaN(e) ? lastEle : e;
    lastEle = ele;
    d += `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(ele).toFixed(1)} `;
  });
  const area = `${d} L ${x(eles.length - 1).toFixed(1)} ${H - PAD} L ${x(0).toFixed(1)} ${H - PAD} Z`;

  return (
    <div className="elev">
      <div className="elev-head">
        <span className="eyebrow">İrtifa profili</span>
        <div className="elev-legend mono">
          <span>En yüksek <b>{Math.round(max).toLocaleString("tr-TR")} m</b></span>
          <span>En düşük <b>{Math.round(min).toLocaleString("tr-TR")} m</b></span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="elev-svg">
        <defs>
          <linearGradient id="elevFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F2B14C" stopOpacity="0.35" />
            <stop offset="1" stopColor="#F2B14C" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={PAD} x2={W - PAD} y1={PAD + g * (H - PAD * 2)} y2={PAD + g * (H - PAD * 2)} stroke="#24382f" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#elevFill)" />
        <path d={d} fill="none" stroke="#F2B14C" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="elev-axis mono">
        <span>0 km</span>
        <span>{km(maxDist)} km</span>
      </div>
    </div>
  );
}
