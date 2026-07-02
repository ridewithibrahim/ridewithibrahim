import Link from "next/link";
import type { RouteSummary } from "@/lib/types";
import { RouteCard } from "./route-card";
import { ArrowIcon } from "./icons";

export function FeaturedRoutes({ routes }: { routes: RouteSummary[] }) {
  return (
    <section className="sec" id="rotalar">
      <div className="wrap">
        <div className="sec-head reveal">
          <div>
            <span className="eyebrow">Öne çıkan rotalar</span>
            <h2>Bu hafta topluluğun favorileri</h2>
          </div>
          <Link className="link" href="/rotalar">
            Tümünü gör <ArrowIcon width={15} height={15} />
          </Link>
        </div>

        {routes.length === 0 ? (
          <div className="empty-cta reveal">
            <p>Henüz rota paylaşılmadı.</p>
            <Link className="btn btn-primary btn-sm" href="/rotalar/yeni">İlk rotayı sen paylaş</Link>
          </div>
        ) : (
          <div className="route-grid">
            {routes.map((r) => (
              <RouteCard key={r.id} route={r} reveal />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
