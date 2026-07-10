import { MapExplorer } from "@/components/map/map-explorer";
import { getMapRoutes } from "@/lib/map-data";
import { getLang } from "@/lib/i18n-server";

export const metadata = {
  title: "Harita — RideWithIbrahim",
  description: "Tüm rotaları haritada keşfet; türe, zorluğa ve ile göre filtrele.",
};

export default async function HaritaPage() {
  const routes = await getMapRoutes();
  const lang = await getLang();
  return (
    <main className="harita-page">
      <MapExplorer routes={routes} lang={lang} />
    </main>
  );
}
