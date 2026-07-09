import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";
import type { EventSummary } from "@/lib/types";
import { EventCard } from "@/components/events/event-card";
import { ArrowIcon } from "./icons";

export function UpcomingEvents({ events, lang = "tr" }: { lang?: Lang; events: EventSummary[] }) {
  return (
    <section className="sec" id="bulusmalar">
      <div className="wrap">
        <div className="sec-head reveal">
          <div>
            <span className="eyebrow">{t(lang, "events_eyebrow")}</span>
            <h2>{t(lang, "events_h2")}</h2>
          </div>
          <Link className="link" href="/bulusmalar">
            {t(lang, "all_events")} <ArrowIcon width={15} height={15} />
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="empty-cta reveal">
            <p>{t(lang, "no_events")}</p>
            <Link className="btn btn-primary btn-sm" href="/bulusmalar/yeni">{t(lang, "create_first_event")}</Link>
          </div>
        ) : (
          <div className="evt-grid">
            {events.map((e) => (
              <EventCard key={e.id} event={e} reveal />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
