"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function WelcomeToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (params.get("welcome") !== "1") return;
    setShow(true);

    // URL'i temizle (yenilemede tekrar çıkmasın)
    const next = new URLSearchParams(params.toString());
    next.delete("welcome");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });

    const t = setTimeout(() => setShow(false), 6000);
    return () => clearTimeout(t);
  }, [params, pathname, router]);

  if (!show) return null;

  return (
    <div className="welcome-toast" role="status">
      <span className="wt-icon">✓</span>
      <div className="wt-body">
        <b>Hesabın oluşturuldu, hoş geldin! 🎉</b>
        <p>Artık rota paylaşabilir, buluşmalara katılabilirsin.</p>
      </div>
      <button className="wt-close" onClick={() => setShow(false)} aria-label="Kapat">
        ✕
      </button>
    </div>
  );
}
