import Link from "next/link";

export default function NotFound() {
  return (
    <main className="nf">
      <div className="nf-bg" aria-hidden>
        <svg viewBox="0 0 1200 600" preserveAspectRatio="xMidYMid slice">
          <g fill="none" stroke="#243a30" strokeWidth="1.2" opacity="0.5">
            <path d="M-20 180 C 240 140 380 220 600 180 S 980 120 1220 180" />
            <path d="M-20 280 C 240 240 380 320 600 280 S 980 220 1220 280" />
            <path d="M-20 390 C 240 355 380 430 600 390 S 980 330 1220 390" />
          </g>
          <path d="M100 460 C 300 420 380 300 560 300 S 820 380 1100 260"
            fill="none" stroke="#F2B14C" strokeWidth="3" strokeLinecap="round" strokeDasharray="3 10" opacity=".6" />
        </svg>
      </div>
      <div className="nf-body">
        <span className="eyebrow">404</span>
        <h1>Bu rota haritada yok.</h1>
        <p>Aradığın sayfa taşınmış ya da hiç var olmamış olabilir. Ana rotaya dönebilir veya haritayı açabilirsin.</p>
        <div className="nf-actions">
          <Link className="btn btn-primary" href="/">Ana sayfa</Link>
          <Link className="btn btn-ghost" href="/harita">Haritayı aç</Link>
        </div>
      </div>
    </main>
  );
}
