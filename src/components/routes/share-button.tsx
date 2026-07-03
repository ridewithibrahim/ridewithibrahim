"use client";

import { useState } from "react";

export function ShareButton({ title, text }: { title: string; text: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;

    // Telefonda yerel paylaşım menüsü (WhatsApp, Instagram vs.)
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch {
        // kullanıcı menüyü kapattı — sorun değil
      }
      return;
    }

    // Masaüstünde: linki panoya kopyala
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // pano erişimi yoksa sessiz geç
    }
  }

  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={share}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
        <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
      </svg>
      {copied ? "Link kopyalandı ✓" : "Paylaş"}
    </button>
  );
}
