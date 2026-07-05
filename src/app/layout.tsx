import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Archivo, Hanken_Grotesk, Space_Mono } from "next/font/google";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

const display = Archivo({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-display",
});
const body = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});
const mono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "RideWithIbrahim — Her rota burada başlar",
  description:
    "Bisiklet, moto, kamp ve keşif severler için topluluk rotası ve buluşma platformu. Rotanı paylaş, haritada keşfet, buluşmalara katıl.",
  metadataBase: new URL("https://ridewithibrahim.com"),
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "RideWithIbrahim",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "RideWithIbrahim — Her rota burada başlar" }],
  },
  twitter: { card: "summary_large_image", images: ["/og-image.png"] },
  appleWebApp: {
    capable: true,
    title: "RideWithIbrahim",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#0C1512",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="tr"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
    >
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
