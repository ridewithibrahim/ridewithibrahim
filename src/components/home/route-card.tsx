import Link from "next/link";
import type { RouteSummary } from "@/lib/types";
import { DIFFICULTY, km, formatDuration } from "@/lib/types";
import { PinIcon, HeartIcon, RouteTypeIcon } from "./icons";
import { SaveButton } from "@/components/routes/save-button";

// A few elevation-profile shapes; picked deterministically per route.
const SPARKS = [
  "M0 110 L20 96 40 100 70 70 100 82 140 50 180 64 220 36 260 48 300 28",
  "M0 120 L30 90 60 104 90 56 120 76 150 30 190 60 230 22 270 52 300 24",
  "M0 100 L40 92 80 78 120 86 160 60 200 72 240 54 280 66 300 58",
  "M0 122 L30 100 60 110 90 64 120 84 150 40 180 58 210 20 250 44 300 14",
];

function sparkIndex(id: string) {
  let h = 0;
  for (const c of id) h = (h + c.charCodeAt(0)) % SPARKS.length;
  return h;
}

export function RouteCard({
  route,
  reveal = false,
}: {
  route: RouteSummary;
  reveal?: boolean;
}) {
  const diff = DIFFICULTY[route.difficulty];
  const path = SPARKS[sparkIndex(route.id)];
  const gid = `spark-${route.id}`;

  return (
    <article className={`rcard${reveal ? " reveal" : ""}`}>
      {/* Tüm kartı tıklanabilir yapan katman; Kaydet butonu üstünde kalır */}
      <Link href={`/rotalar/${route.id}`} className="rcard-link" aria-label={route.title} />

      <div className="thumb">
        {route.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={route.thumbnailUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <svg viewBox="0 0 300 130" preserveAspectRatio="none">
            <defs>
              <linearGradient id={gid} x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor={diff.color} stopOpacity=".35" />
                <stop offset="1" stopColor={diff.color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={`${path} 300 130 0 130Z`} fill={`url(#${gid})`} />
            <path d={path} fill="none" stroke={diff.color} strokeWidth="2" />
          </svg>
        )}
        <span className={`diff ${diff.className}`}>{diff.label}</span>
        <span className="rtype" aria-hidden>
          <RouteTypeIcon type={route.routeType} width={16} height={16} />
        </span>
      </div>

      <div className="body">
        <div>
          <h3>{route.title}</h3>
          <div className="loc"><PinIcon width={11} height={11} /> {route.province}</div>
          {route.authorUsername && (
            <Link href={`/profil/${route.authorUsername}`} className="rcard-author">
              @{route.authorUsername}
            </Link>
          )}
        </div>
        <div className="stats">
          <span><b>{km(route.distanceM)}</b> km</span>
          <span>↑ <b>{route.elevationGainM.toLocaleString("tr-TR")}</b> m</span>
          <span><b>{formatDuration(route.durationMin)}</b></span>
        </div>
        <div className="foot">
          <span className="likes"><HeartIcon width={16} height={16} />{route.likesCount}</span>
          <SaveButton routeId={route.id} initialSaved={route.saved ?? false} />
        </div>
      </div>
    </article>
  );
}
