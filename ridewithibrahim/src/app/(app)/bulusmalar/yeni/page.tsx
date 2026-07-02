import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/events/event-form";

export const metadata = { title: "Yeni buluşma — RideWithIbrahim" };

export default async function NewEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bulusmalar/yeni");

  return (
    <main className="rf-page">
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div className="rf-head">
          <span className="eyebrow">Buluşma aç</span>
          <h1>Yeni buluşma</h1>
          <p>Topluluğu bir sürüşe ya da kampa davet et. Tarihi, yeri ve kapasiteyi belirle.</p>
        </div>
        <EventForm />
      </div>
    </main>
  );
}
