import Link from "next/link";

export const metadata = {
  title: "RideWithIbrahim — Every route starts here",
  description:
    "Community route platform for cycling, motorcycling and camping. Explore routes on the map, draw your own in a minute, find campsites and join group rides. Free, no ads.",
  alternates: {
    canonical: "/en",
    languages: { tr: "/", en: "/en" },
  },
  openGraph: {
    title: "RideWithIbrahim — Every route starts here",
    description:
      "Community routes for cycling, moto and camping — now including the Dutch LF national routes. Free, no ads.",
  },
};

const FEATURES = [
  {
    emoji: "🗺️",
    title: "Explore on the map",
    desc: "Routes with distance, elevation gain and difficulty — filter by type, tap “My location” to see what's near you.",
  },
  {
    emoji: "🖊️",
    title: "Draw your route",
    desc: "No GPX file? Click on the map and draw your route in about a minute. Distance is calculated automatically.",
  },
  {
    emoji: "⛺",
    title: "Campsites layer",
    desc: "Hundreds of campsites across Türkiye with fee, water and facility info — one tap for navigation.",
  },
  {
    emoji: "🇳🇱",
    title: "Dutch LF routes",
    desc: "The national LF network — Kustroute, Schelde-Rheinroute, Waterlinieroute and more — mapped with satellite covers.",
  },
  {
    emoji: "🤝",
    title: "Group rides",
    desc: "Create or join meetups, see who's coming, message riders directly.",
  },
  {
    emoji: "🏆",
    title: "Ranks & badges",
    desc: "Share routes, collect kilometres, climb the weekly leaderboard.",
  },
];

export default function EnglishLanding() {
  return (
    <main className="sec" style={{ paddingTop: 56 }}>
      <div className="wrap" style={{ maxWidth: 880 }}>
        <span className="eyebrow">Cycling · Moto · Camping</span>
        <h1 style={{ fontFamily: "var(--font-display), sans-serif", fontWeight: 800, fontSize: "clamp(34px, 6vw, 56px)", letterSpacing: "-.02em", lineHeight: 1.05, marginTop: 10 }}>
          Every route <span style={{ color: "var(--amber)" }}>starts here.</span>
        </h1>
        <p style={{ color: "var(--ink-dim)", fontSize: 17, lineHeight: 1.65, marginTop: 16, maxWidth: 620 }}>
          RideWithIbrahim is a community route platform. Upload a GPX or draw your route on the map,
          discover rides near you, find campsites, and meet other riders. Free and ad-free.
        </p>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 26 }}>
          <Link className="btn btn-primary" href="/harita">Explore the map</Link>
          <Link className="btn btn-ghost" href="/signup">Join free</Link>
        </div>

        <div className="contact-grid" style={{ marginTop: 44 }}>
          {FEATURES.map((f) => (
            <div key={f.title} className="contact-card" style={{ cursor: "default" }}>
              <span className="em" aria-hidden>{f.emoji}</span>
              <b>{f.title}</b>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="legal-note" style={{ marginTop: 36 }}>
          Community content (route names, comments, meetups) is mostly in Turkish — your browser&apos;s
          built-in translation handles it nicely. The maps, numbers and navigation buttons speak every
          language. 🚴 · <Link href="/" style={{ color: "var(--amber)" }}>Türkçe</Link>
        </p>
      </div>
    </main>
  );
}
