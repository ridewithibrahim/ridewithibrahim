const data = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://ridewithibrahim.com/#website",
      url: "https://ridewithibrahim.com",
      name: "RideWithIbrahim",
      description: "Bisiklet, moto ve kamp rotaları için topluluk platformu.",
      inLanguage: ["tr", "en"],
    },
    {
      "@type": "Organization",
      "@id": "https://ridewithibrahim.com/#org",
      name: "RideWithIbrahim",
      url: "https://ridewithibrahim.com",
      logo: "https://ridewithibrahim.com/og-image.png",
      email: "mail@ridewithibrahim.com",
    },
  ],
};

export function SiteJsonLd() {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
