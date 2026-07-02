import Link from "next/link";
import type { EventSummary } from "@/lib/types";
import { EventCard } from "@/components/events/event-card";
import { ArrowIcon } from "./icons";

export function UpcomingEvents({ events }: { events: EventSummary[] }) {
  return (
    <section className="sec" id="bulusmalar">
      <div className="wrap">
        <div className="sec-head reveal">
          <div>
            <span className="eyebrow">Yaklaşan buluşmalar</span>
            <h2>Topluluğa katıl</h2>
          </div>
          <Link className="link" href="/bulusmalar">
            Tüm etkinlikler <ArrowIcon width={15} height={15} />
          </Link>
        </div>

        <div className="evt-grid">
          {events.map((e) => (
            <EventCard key={e.id} event={e} reveal />
          ))}
        </div>
      </div>
    </section>
  );
}
