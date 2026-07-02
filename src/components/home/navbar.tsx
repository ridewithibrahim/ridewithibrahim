"use client";

import { useState } from "react";
import Link from "next/link";
import { signout } from "@/app/(auth)/actions";

const LINKS = [
  { href: "/rotalar", label: "Rotalar" },
  { href: "/harita", label: "Harita" },
  { href: "/bulusmalar", label: "Buluşmalar" },
  { href: "/liderlik", label: "Liderlik" },
];

export function Navbar({ username }: { username?: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="rw-nav">
      <div className="wrap">
        <Link href="/" className="brand">
          <span className="mark">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="17" r="3.2" /><circle cx="18" cy="17" r="3.2" />
              <path d="M6 17l4-8h5l-3 8M10 9l-2-3h3" />
            </svg>
          </span>
          Ride<b>With</b>Ibrahim
        </Link>

        <div className="nav-links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href}>{l.label}</Link>
          ))}
        </div>

        <div className="nav-cta">
          {username ? (
            <>
              <Link className="btn btn-ghost btn-sm" href={`/profil/${username}`}>
                @{username}
              </Link>
              <form action={signout}>
                <button className="btn btn-primary btn-sm" type="submit">Çıkış</button>
              </form>
            </>
          ) : (
            <>
              <Link className="btn btn-ghost btn-sm" href="/login">Giriş yap</Link>
              <Link className="btn btn-primary btn-sm" href="/signup">Ücretsiz katıl</Link>
            </>
          )}
          <button className="nav-burger" aria-label="Menü" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>

      <div className={`nav-mobile${open ? " open" : ""}`}>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.label}</Link>
        ))}
        {!username && <Link href="/login" onClick={() => setOpen(false)}>Giriş yap</Link>}
      </div>
    </nav>
  );
}
