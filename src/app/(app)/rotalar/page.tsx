import Link from "next/link";
import { RoutesExplorer } from "@/components/routes/routes-explorer";
import { getLang } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { PlusIcon } from "@/components/home/icons";

export const metadata = {
  title: "Rotalar — RideWithIbrahim",
  description: "Türe, zorluğa, mesafeye ve ile göre tüm rotaları keşfet.",
};

export default async function RoutesPage() {
  const lang = await getLang();
  return (
    <main className="sec" style={{ paddingTop: 40 }}>
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">{lang === "en" ? "All routes" : "Tüm rotalar"}</span>
            <h2>{t(lang, "hero_explore")}</h2>
          </div>
          <div className="head-actions">
            <Link className="btn btn-primary btn-sm" href="/rotalar/yeni">
              <PlusIcon width={16} height={16} /> {t(lang, "add_route")}
            </Link>
            <Link className="btn btn-ghost btn-sm btn-rec" href="/kayit">
              {t(lang, "record_route")}
            </Link>
          </div>
        </div>

        <RoutesExplorer lang={lang} />
      </div>
    </main>
  );
}
