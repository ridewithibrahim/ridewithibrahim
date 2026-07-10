import Link from "next/link";
import { getLang } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { getEvents } from "@/lib/queries";
import { EventCard } from "@/components/events/event-card";
import { PlusIcon } from "@/components/home/icons";

export const metadata = {
  title: "Buluşmalar — RideWithIbrahim",
  description: "Yaklaşan topluluk buluşmaları — sürüşler, turlar, kamplar.",
};

export default async function EventsPage() {
  const lang = await getLang();
  const events = await getEvents();

  return (
    <main className="sec" style={{ paddingTop: 40 }}>
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">{t(lang, "events_eyebrow")}</span>
            <h2>{t(lang, "events_h2")}</h2>
          </div>
          <Link className="btn btn-primary btn-sm" href="/bulusmalar/yeni">
            <PlusIcon width={16} height={16} /> Buluşma aç
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="empty" style={{ padding: "60px 20px" }}>
            Yaklaşan buluşma yok.<br />İlk buluşmayı sen aç.
          </div>
        ) : (
          <div className="evt-grid">
            {events.map((e) => (
              <EventCard key={e.id} event={e} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
