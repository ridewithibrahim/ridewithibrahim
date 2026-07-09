import Link from "next/link";
import type { RouteSummary } from "@/lib/types";
import { RouteCard } from "./route-card";
import { ArrowIcon } from "./icons";
import { t, type Lang } from "@/lib/i18n";

export function FeaturedRoutes({ routes, lang = "tr" }: { routes: RouteSummary[]; lang?: Lang }) {
  return (
    <section className="sec" id="rotalar">
      <div className="wrap">
        <div className="sec-head reveal">
          <div>
            <span className="eyebrow">{t(lang, "featured_eyebrow")}</span>
            <h2>{t(lang, "featured_h2")}</h2>
          </div>
          <Link className="link" href="/rotalar">
            {t(lang, "see_all")} <ArrowIcon width={15} height={15} />
          </Link>
        </div>

        {routes.length === 0 ? (
          <div className="empty-cta reveal">
            <p>{t(lang, "no_routes_yet")}</p>
            <Link className="btn btn-primary btn-sm" href="/rotalar/yeni">{t(lang, "share_first")}</Link>
          </div>
        ) : (
          <div className="route-grid">
            {routes.map((r) => (
              <RouteCard key={r.id} route={r} reveal lang={lang} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
