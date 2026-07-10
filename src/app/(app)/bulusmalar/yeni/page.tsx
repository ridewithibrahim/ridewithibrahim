import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n-server";
import { EventForm } from "@/components/events/event-form";

export const metadata = { title: "Yeni buluşma — RideWithIbrahim" };

export default async function NewEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bulusmalar/yeni");

  const lang = await getLang();

  return (
    <main className="rf-page">
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div className="rf-head">
          <span className="eyebrow">{lang === "en" ? "Create a meetup" : "Buluşma aç"}</span>
          <h1>{lang === "en" ? "New meetup" : "Yeni buluşma"}</h1>
          <p>{lang === "en" ? "Invite the community to a ride or a camp. Set the date, place and capacity." : "Topluluğu bir sürüşe ya da kampa davet et. Tarihi, yeri ve kapasiteyi belirle."}</p>
        </div>
        <EventForm lang={lang} />
      </div>
    </main>
  );
}
