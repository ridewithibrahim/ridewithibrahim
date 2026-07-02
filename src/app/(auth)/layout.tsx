import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="auth-shell">
      <div className="auth-bg" aria-hidden>
        <svg viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <g fill="none" stroke="#243a30" strokeWidth="1.2" opacity="0.5">
            <path d="M-20 220 C 240 180 380 260 600 220 S 980 160 1220 220" />
            <path d="M-20 320 C 240 280 380 360 600 320 S 980 260 1220 320" />
            <path d="M-20 430 C 240 395 380 470 600 430 S 980 370 1220 430" />
            <path d="M-20 550 C 240 515 380 590 600 550 S 980 490 1220 550" />
          </g>
        </svg>
      </div>
      <div className="auth-card">
        <Link href="/" className="brand" style={{ marginBottom: 22 }}>
          <span className="mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="17" r="3.2" /><circle cx="18" cy="17" r="3.2" />
              <path d="M6 17l4-8h5l-3 8M10 9l-2-3h3" />
            </svg>
          </span>
          Ride<b>With</b>Ibrahim
        </Link>
        {children}
      </div>
    </main>
  );
}
