import Link from "next/link";
import { MapIcon, PlusIcon, PinIcon } from "./icons";
import type { SiteStats, HeroRoute } from "@/lib/queries";
import { DIFFICULTY, km, formatDuration } from "@/lib/types";
import { t, diffName, typeName, type Lang } from "@/lib/i18n";

export function Hero({ stats, route, lang = "tr" }: { stats?: SiteStats; route?: HeroRoute | null; lang?: Lang }) {
  // Vitrin kartı: gerçek rota varsa onu göster, yoksa örnek içerikle ayakta kal.
  const r = route ?? null;
  const cardTitle = r?.title ?? "Kartepe Zirve Tırmanışı";
  const cardSub = r ? `${r.province} · ${typeName(lang, r.routeType)}` : "Kocaeli · Yol Bisikleti";
  const diffLabel = r ? diffName(lang, r.difficulty) : "Zor";
  const diffClass = r ? DIFFICULTY[r.difficulty].className : "hard";
  const pathColor = r ? DIFFICULTY[r.difficulty].color : "#5FB8A3";
  const distTxt = r ? km(r.distanceM) : "48,2";
  const gainTxt = r ? `↑${r.elevationGainM.toLocaleString("tr-TR")}` : "↑1.240";
  const durTxt = r ? formatDuration(r.durationMin) : "3:10";
  const pinB = r ? `↑ ${r.elevationGainM.toLocaleString("tr-TR")} m ${t(lang, "climb")}` : "ZİRVE 1.640m";

  const items = [
    { num: (stats?.routes ?? 0).toLocaleString("tr-TR"), lbl: t(lang, "stat_routes") },
    { num: "500+", lbl: t(lang, "stat_camps") },
    { num: (stats?.totalKm ?? 0).toLocaleString("tr-TR"), lbl: t(lang, "stat_km") },
    { num: (stats?.events ?? 0).toLocaleString("tr-TR"), lbl: t(lang, "stat_meetups") },
  ];
  return (
    <header className="hero">
      <div className="hero-glow" />
      <div className="hero-bg" aria-hidden>
        <svg viewBox="0 0 1200 620" preserveAspectRatio="xMidYMid slice">
          <g fill="none" stroke="#2a4035" strokeWidth="1" opacity="0.55">
            <path d="M-50 470 C 200 420 340 500 520 450 S 880 360 1100 420 1300 400 1300 400" />
            <path d="M-50 510 C 220 470 360 540 540 495 S 900 410 1110 470 1300 450 1300 450" />
            <path d="M-50 550 C 240 520 380 580 560 540 S 920 460 1120 520 1300 500 1300 500" />
          </g>
          <g fill="none" stroke="#243a30" strokeWidth="1" opacity="0.5">
            <path d="M760 30 C 900 60 980 160 940 250 S 760 340 700 270 660 120 760 30 Z" />
            <path d="M790 70 C 900 95 960 175 928 245 S 790 312 742 258 716 130 790 70 Z" />
            <path d="M818 110 C 900 130 945 188 918 242 S 820 290 778 250 766 145 818 110 Z" />
          </g>
          <path className="hero-route-path" d="M70 540 C 220 500 250 360 400 360 S 620 470 760 380 980 200 1140 250"
            fill="none" stroke="#F2B14C" strokeWidth="3.5" strokeLinecap="round" />
          <circle className="drop" style={{ animationDelay: ".4s" }} cx="70" cy="540" r="7" fill="#F2B14C" stroke="#0C1512" strokeWidth="3" />
          <circle className="drop" style={{ animationDelay: "2.4s" }} cx="1140" cy="250" r="7" fill="#0C1512" stroke="#F2B14C" strokeWidth="3" />
        </svg>
      </div>

      <div className="wrap">
        <div className="hero-grid">
          <div>
            <span className="hero-eyebrow">
              <span className="dot" />
              <span className="eyebrow">{t(lang, "hero_eyebrow")}</span>
            </span>
            <h1>{t(lang, "hero_h1a")}<br /><span className="accent">{t(lang, "hero_h1b")}</span></h1>
            <p className="lead">{t(lang, "hero_lead")}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" href="/harita">
                <MapIcon width={18} height={18} /> {t(lang, "hero_explore")}
              </Link>
              <Link className="btn btn-ghost" href="/rotalar/yeni">
                <PlusIcon width={18} height={18} /> {t(lang, "cta_share")}
              </Link>
            </div>
            <div className="hero-stats">
              {items.map((s) => (
                <div className="stat" key={s.lbl}>
                  <div className="num">{s.num}</div>
                  <div className="lbl">{s.lbl}</div>
                </div>
              ))}
            </div>
          </div>

          {r ? (
            <Link href={`/rotalar/${r.id}`} className="hero-card hero-card-link" aria-label={`${cardTitle} rotasını incele`}>
            <div className="map">
              <svg viewBox="0 0 420 248" preserveAspectRatio="none" aria-hidden>
                <g fill="none" stroke="#1f352b" strokeWidth="1">
                  <path d="M0 70 C 90 50 150 90 240 70 S 380 40 440 60" />
                  <path d="M0 120 C 90 100 150 140 240 120 S 380 90 440 110" />
                  <path d="M0 175 C 90 158 150 196 240 178 S 380 148 440 168" />
                </g>
                <path className="hero-card-path" d="M55 200 C 120 180 130 120 200 120 S 300 70 360 55"
                  fill="none" stroke={pathColor} strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="pin a">{t(lang, "start_pin")}</span>
              <span className="pin b">{pinB}</span>
            </div>
            <div className="hc-meta">
              <div>
                <div className="hc-title">{cardTitle}</div>
                <div className="hc-sub"><PinIcon width={12} height={12} /> {cardSub}</div>
              </div>
              <span className={`diff ${diffClass}`} style={{ position: "static" }}>{diffLabel}</span>
            </div>
            <div className="hc-readout">
              <div><div className="k">{t(lang, "distance")}</div><div className="v">{distTxt}<span style={{ fontSize: 11, color: "var(--ink-faint)" }}> km</span></div></div>
              <div><div className="k">{t(lang, "elevation")}</div><div className="v amber">{gainTxt}<span style={{ fontSize: 11, color: "var(--ink-faint)" }}> m</span></div></div>
              <div><div className="k">{t(lang, "duration")}</div><div className="v">{durTxt}</div></div>
            </div>
          </Link>
          ) : (
          <div className="hero-card">
            <div className="map">
              <svg viewBox="0 0 420 248" preserveAspectRatio="none" aria-hidden>
                <g fill="none" stroke="#1f352b" strokeWidth="1">
                  <path d="M0 70 C 90 50 150 90 240 70 S 380 40 440 60" />
                  <path d="M0 120 C 90 100 150 140 240 120 S 380 90 440 110" />
                  <path d="M0 175 C 90 158 150 196 240 178 S 380 148 440 168" />
                </g>
                <path className="hero-card-path" d="M55 200 C 120 180 130 120 200 120 S 300 70 360 55"
                  fill="none" stroke={pathColor} strokeWidth="3" strokeLinecap="round" />
              </svg>
              <span className="pin a">{t(lang, "start_pin")}</span>
              <span className="pin b">{pinB}</span>
            </div>
            <div className="hc-meta">
              <div>
                <div className="hc-title">{cardTitle}</div>
                <div className="hc-sub"><PinIcon width={12} height={12} /> {cardSub}</div>
              </div>
              <span className={`diff ${diffClass}`} style={{ position: "static" }}>{diffLabel}</span>
            </div>
            <div className="hc-readout">
              <div><div className="k">{t(lang, "distance")}</div><div className="v">{distTxt}<span style={{ fontSize: 11, color: "var(--ink-faint)" }}> km</span></div></div>
              <div><div className="k">{t(lang, "elevation")}</div><div className="v amber">{gainTxt}<span style={{ fontSize: 11, color: "var(--ink-faint)" }}> m</span></div></div>
              <div><div className="k">{t(lang, "duration")}</div><div className="v">{durTxt}</div></div>
            </div>
          </div>
          )}
        </div>
      </div>
    </header>
  );
}
