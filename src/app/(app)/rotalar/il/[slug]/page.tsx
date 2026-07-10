import Link from "next/link";
import { notFound } from "next/navigation";
import { getProvinces, getRoutesByProvince } from "@/lib/queries";
import { slugifyProvince } from "@/lib/slug";
import { RouteCard } from "@/components/home/route-card";
import { getLang } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";

async function resolveProvince(slug: string): Promise<string | null> {
  const provinces = await getProvinces();
  return provinces.find((p) => slugifyProvince(p) === slug) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const province = await resolveProvince(slug);
  if (!province) return { title: "Rotalar — RideWithIbrahim" };
  return {
    title: `${province} Bisiklet Rotaları — RideWithIbrahim`,
    description: `${province} bölgesindeki bisiklet, MTB, moto ve kamp rotaları — mesafe, tırmanış ve zorluk bilgileriyle. Haritada keşfet, GPX indir, yola çık.`,
    alternates: { canonical: `/rotalar/il/${slug}` },
    openGraph: {
      title: `${province} Bisiklet Rotaları`,
      description: `${province} bölgesindeki topluluk rotaları — RideWithIbrahim.`,
    },
  };
}

export default async function ProvincePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lang = await getLang();
  const province = await resolveProvince(slug);
  if (!province) notFound();

  const routes = await getRoutesByProvince(province);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "RideWithIbrahim", item: "https://ridewithibrahim.com" },
      { "@type": "ListItem", position: 2, name: lang === "en" ? "Routes" : "Rotalar", item: "https://ridewithibrahim.com/rotalar" },
      { "@type": "ListItem", position: 3, name: province, item: `https://ridewithibrahim.com/rotalar/il/${slug}` },
    ],
  };

  return (
    <main className="sec" style={{ paddingTop: 40 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">{lang === "en" ? "Region" : "İl"}</span>
            <h2>
              {province} {lang === "en" ? "routes" : "rotaları"}
            </h2>
            <p style={{ color: "var(--ink-dim)", marginTop: 8, fontSize: 15 }}>
              {routes.length} {t(lang, "routes_word")} ·{" "}
              <Link href="/harita" style={{ color: "var(--spruce)" }}>
                {t(lang, "cta_open_map")} →
              </Link>
            </p>
          </div>
        </div>

        {routes.length === 0 ? (
          <div className="empty" style={{ padding: "60px 20px" }}>
            {t(lang, "empty_filtered")}
          </div>
        ) : (
          <div className="route-grid">
            {routes.map((r) => (
              <RouteCard key={r.id} route={r} lang={lang} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
