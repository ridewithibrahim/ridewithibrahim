"use client";

import Link from "next/link";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="nf">
      <div className="nf-body">
        <span className="eyebrow">Bir şeyler ters gitti</span>
        <h1>Zincir attı.</h1>
        <p>Beklenmedik bir hata oluştu. Tekrar denemek genelde işe yarar; olmazsa ana sayfaya dön.</p>
        <div className="nf-actions">
          <button className="btn btn-primary" onClick={reset}>Tekrar dene</button>
          <Link className="btn btn-ghost" href="/">Ana sayfa</Link>
        </div>
      </div>
    </main>
  );
}
