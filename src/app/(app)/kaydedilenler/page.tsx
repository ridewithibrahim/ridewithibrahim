import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSavedRoutes } from "@/lib/queries";
import { RouteCard } from "@/components/home/route-card";

export const metadata = { title: "Kaydettiklerim — RideWithIbrahim" };

export default async function SavedRoutesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/kaydedilenler");

  const routes = await getSavedRoutes(user.id);

  return (
    <main className="sec" style={{ paddingTop: 40 }}>
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">Koleksiyonun</span>
            <h2>Kaydettiklerim</h2>
          </div>
          <Link className="btn btn-ghost btn-sm" href="/rotalar">
            Rotaları keşfet →
          </Link>
        </div>

        {routes.length === 0 ? (
          <div className="empty" style={{ padding: "60px 20px" }}>
            Henüz rota kaydetmedin.
            <br />
            Beğendiğin rotalarda 🔖 simgesine dokun, burada biriksin.
            <br />
            <Link href="/rotalar" style={{ color: "var(--amber)", fontWeight: 600 }}>
              Rotalara göz at →
            </Link>
          </div>
        ) : (
          <div className="route-grid">
            {routes.map((r) => (
              <RouteCard key={r.id} route={r} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
