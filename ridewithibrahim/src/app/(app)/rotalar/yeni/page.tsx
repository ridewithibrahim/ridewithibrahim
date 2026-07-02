import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RouteForm } from "@/components/routes/route-form";

export const metadata = { title: "Yeni rota — RideWithIbrahim" };

export default async function NewRoutePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/rotalar/yeni");

  return (
    <main className="rf-page">
      <div className="wrap" style={{ maxWidth: 720 }}>
        <div className="rf-head">
          <span className="eyebrow">Rota paylaş</span>
          <h1>Yeni rota ekle</h1>
          <p>GPX dosyanı yükle; mesafe, irtifa ve süre otomatik hesaplanır. Haritada önizle, yayınla.</p>
        </div>
        <RouteForm />
      </div>
    </main>
  );
}
