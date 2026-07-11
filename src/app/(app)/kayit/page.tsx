import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RideTracker } from "@/components/ride/ride-tracker";
import { getLang } from "@/lib/i18n-server";

export const metadata = { title: "Rota Kaydet — RideWithIbrahim" };

export default async function RecordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/kayit");

  const lang = await getLang();

  return (
    <main className="ride-page">
      <RideTracker mode="record" lang={lang} />
    </main>
  );
}
