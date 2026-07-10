import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLang } from "@/lib/i18n-server";
import { RouteForm } from "@/components/routes/route-form";

export const metadata = { title: "Yeni rota — RideWithIbrahim" };

export default async function NewRoutePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/rotalar/yeni");

  const lang = await getLang();

  return (
    <main className="rf-page">
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div className="rf-head">
          <span className="eyebrow">{lang === "en" ? "Share a route" : "Rota paylaş"}</span>
          <h1>{lang === "en" ? "Add a new route" : "Yeni rota ekle"}</h1>
          <p>{lang === "en" ? "Upload your GPX — distance, elevation and time are calculated automatically. Preview on the map, publish." : "GPX dosyanı yükle; mesafe, irtifa ve süre otomatik hesaplanır. Haritada önizle, yayınla."}</p>
        </div>
        <RouteForm lang={lang} />
      </div>
    </main>
  );
}
