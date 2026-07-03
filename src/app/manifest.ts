import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RideWithIbrahim",
    short_name: "RideWith",
    description:
      "Bisiklet, moto, kamp ve keşif rotaları için topluluk haritası ve buluşma platformu.",
    start_url: "/",
    display: "standalone",
    background_color: "#0C1512",
    theme_color: "#0C1512",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
