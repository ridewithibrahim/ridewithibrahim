import Link from "next/link";
import { t, type Lang } from "@/lib/i18n";

export function CtaBand({ authed = false, lang = "tr" }: { authed?: boolean; lang?: Lang }) {
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
          <h2>{t(lang, "cta_title")}</h2>
          {authed ? (
            <>
              <p>{t(lang, "cta_authed_p")}</p>
              <div className="actions">
                <Link className="btn btn-primary" href="/rotalar/yeni">{t(lang, "cta_share")}</Link>
                <Link className="btn btn-ghost" href="/harita">{t(lang, "cta_open_map")}</Link>
              </div>
            </>
          ) : (
            <>
              <p>{t(lang, "cta_guest_p")}</p>
              <div className="actions">
                <Link className="btn btn-primary" href="/signup">{t(lang, "join")}</Link>
                <Link className="btn btn-ghost" href="/harita">{t(lang, "cta_browse")}</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function Footer({ lang = "tr" }: { lang?: Lang }) {
  const COLS = [
    {
      h: t(lang, "f_explore"),
      links: [
        { label: t(lang, "nav_routes"), href: "/rotalar" },
        { label: t(lang, "nav_map"), href: "/harita" },
        { label: t(lang, "nav_meetups"), href: "/bulusmalar" },
        { label: t(lang, "nav_leaderboard"), href: "/liderlik" },
      ],
    },
    {
      h: t(lang, "f_community"),
      links: [
        { label: t(lang, "cta_share"), href: "/rotalar/yeni" },
        { label: t(lang, "f_new_meetup"), href: "/bulusmalar/yeni" },
        { label: t(lang, "saved"), href: "/kaydedilenler" },
        { label: t(lang, "f_account"), href: "/ayarlar" },
      ],
    },
    {
      h: t(lang, "f_support"),
      links: [
        { label: t(lang, "f_contact"), href: "/iletisim" },
        { label: t(lang, "f_privacy"), href: "/gizlilik" },
        { label: t(lang, "f_terms"), href: "/sartlar" },
      ],
    },
  ];

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
            <p>{t(lang, "f_tagline")}</p>
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
          <span>{t(lang, "f_made")}</span>
        </div>
      </div>
    </footer>
  );
}
