import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";
import type { EventSummary } from "@/lib/types";
import { ROUTE_TYPES, monthShort, dayOfMonth } from "@/lib/types";
import { PinIcon } from "@/components/home/icons";

const AVATAR_COLORS = ["#F2B14C", "#5FB8A3", "#7FC2E0", "#54B97C", "#E2823F", "#D45D49", "#5BA3D0"];

export function EventCard({ event, reveal = false,
  lang = "tr",
}: { event: EventSummary; reveal?: boolean;
  lang?: Lang;
}) {
  const initials = event.title
    .split(" ")
    .slice(0, 3)
    .map((w) => w[0]?.toUpperCase())
    .filter(Boolean);
  const extra = Math.max(event.attendeeCount - initials.length, 0);

  return (
    <article className={`ecard${reveal ? " reveal" : ""}`}>
      <div className="edate">
        <div className="m">{monthShort(event.startsAt)}</div>
        <div className="d">{String(dayOfMonth(event.startsAt)).padStart(2, "0")}</div>
      </div>
      <div className="e-body">
        <span className="e-tag">{ROUTE_TYPES[event.eventType].tag}</span>
        <h3>{event.title}</h3>
        <div className="e-loc"><PinIcon width={11} height={11} /> {event.location}</div>
        <div className="e-foot">
          <div style={{ display: "flex", alignItems: "center" }}>
            <div className="avatars">
              {initials.map((ini, i) => (
                <span key={i} style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>{ini}</span>
              ))}
              {extra > 0 && <span className="more">+{extra}</span>}
            </div>
            <span className="e-count">{event.attendeeCount} {t(lang, "going_count")}</span>
          </div>
          <Link className="btn btn-primary btn-sm" href={`/bulusmalar/${event.id}`}>{t(lang, "detail_link")}</Link>
        </div>
      </div>
    </article>
  );
}
