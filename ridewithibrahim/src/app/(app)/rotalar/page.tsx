import Link from "next/link";
import { RoutesExplorer } from "@/components/routes/routes-explorer";
import { PlusIcon } from "@/components/home/icons";

export const metadata = {
  title: "Rotalar — RideWithIbrahim",
  description: "Türe, zorluğa, mesafeye ve ile göre tüm rotaları keşfet.",
};

export default function RoutesPage() {
  return (
    <main className="sec" style={{ paddingTop: 40 }}>
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">Tüm rotalar</span>
            <h2>Rotaları keşfet</h2>
          </div>
          <Link className="btn btn-primary btn-sm" href="/rotalar/yeni">
            <PlusIcon width={16} height={16} /> Rota ekle
          </Link>
        </div>

        <RoutesExplorer />
      </div>
    </main>
  );
}
