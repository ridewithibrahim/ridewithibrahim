import Link from "next/link";

export function CtaBand({ authed = false }: { authed?: boolean }) {
  return (
    <section className="sec" style={{ paddingTop: 0 }}>
      <div className="wrap">
        <div className="cta-band reveal">
          <div className="contour" aria-hidden>
            <svg viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice">
              <g fill="none" stroke="#2a4035" strokeWidth="1.2">
                <path d="M-20 80 C 240 40 380 120 600 80 S 980 20 1220 80" />
                <path d="M-20 150 C 240 110 380 190 600 150 S 980 90 1220 150" />
                <path d="M-20 220 C 240 185 380 260 600 220 S 980 160 1220 220" />
              </g>
            </svg>
          </div>
          <h2>Bir sonraki rotan seni bekliyor.</h2>
          {authed ? (
            <>
              <p>Bildiğin güzel bir parkur mu var? Paylaş, topluluk keşfetsin.</p>
              <div className="actions">
                <Link className="btn btn-primary" href="/rotalar/yeni">Rota paylaş</Link>
                <Link className="btn btn-ghost" href="/harita">Haritayı aç</Link>
              </div>
            </>
          ) : (
            <>
              <p>Aramıza katıl, ilk rotanı paylaş ve Türkiye&apos;nin en aktif sürüş topluluğunun parçası ol.</p>
              <div className="actions">
                <Link className="btn btn-primary" href="/signup">Katıl</Link>
                <Link className="btn btn-ghost" href="/harita">Önce rotalara bak</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

const COLS: { h: string; links: { label: string; href: string }[] }[] = [
  {
    h: "Keşfet",
    links: [
      { label: "Rotalar", href: "/rotalar" },
      { label: "Harita", href: "/harita" },
      { label: "Buluşmalar", href: "/bulusmalar" },
      { label: "Liderlik", href: "/liderlik" },
    ],
  },
  {
    h: "Topluluk",
    links: [
      { label: "Rota paylaş", href: "/rotalar/yeni" },
      { label: "Buluşma aç", href: "/bulusmalar/yeni" },
      { label: "Kaydettiklerim", href: "/kaydedilenler" },
      { label: "🌐 English", href: "/en" },
      { label: "Hesap ayarları", href: "/ayarlar" },
    ],
  },
  {
    h: "Destek",
    links: [
      { label: "İletişim", href: "/iletisim" },
      { label: "Gizlilik", href: "/gizlilik" },
      { label: "Kullanım Şartları", href: "/sartlar" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="ft">
      <div className="wrap">
        <div className="ft-grid">
          <div>
            <Link href="/" className="brand">
              <span className="mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="17" r="3.2" /><circle cx="18" cy="17" r="3.2" />
                  <path d="M6 17l4-8h5l-3 8M10 9l-2-3h3" />
                </svg>
              </span>
              Ride<b>With</b>Ibrahim
            </Link>
            <p>Bisiklet, moto, kamp ve keşif severler için topluluk rotası ve buluşma platformu.</p>
          </div>
          {COLS.map((c) => (
            <div className="ft-col" key={c.h}>
              <h4>{c.h}</h4>
              {c.links.map((l) => (
                <Link key={l.label} href={l.href}>{l.label}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="ft-bottom">
          <span className="mono">© 2026 RideWithIbrahim.com</span>
          <span>Türkiye&apos;de tasarlandı · Dünya için 🌍</span>
        </div>
      </div>
    </footer>
  );
}
