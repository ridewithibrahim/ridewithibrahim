import { MapExplorer } from "@/components/map/map-explorer";
import { getMapRoutes } from "@/lib/map-data";

export const metadata = {
  title: "Harita — RideWithIbrahim",
  description: "Tüm rotaları haritada keşfet; türe, zorluğa ve ile göre filtrele.",
};

export default async function HaritaPage() {
  const routes = await getMapRoutes();
  return (
    <main className="harita-page">
      <MapExplorer routes={routes} />
    </main>
  );
}
