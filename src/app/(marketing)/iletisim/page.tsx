export const metadata = { title: "İletişim — RideWithIbrahim" };

const MAIL = "mail@ridewithibrahim.com";

const CHANNELS = [
  {
    emoji: "💡",
    title: "Öneri & geri bildirim",
    desc: "Yeni özellik fikri mi var? Bir şey daha iyi olabilir mi? Dinliyoruz.",
    subject: "Öneri — RideWithIbrahim",
  },
  {
    emoji: "🐞",
    title: "Hata bildirimi",
    desc: "Çalışmayan bir şey mi gördün? Ekran görüntüsüyle yazarsan hızlıca düzeltiriz.",
    subject: "Hata bildirimi — RideWithIbrahim",
  },
  {
    emoji: "🤝",
    title: "İşbirliği",
    desc: "Kulüp etkinlikleri, buluşma organizasyonları ve marka işbirlikleri için.",
    subject: "İşbirliği — RideWithIbrahim",
  },
];

export default function ContactPage() {
  return (
    <main className="legal">
      <div className="wrap">
        <span className="eyebrow">İletişim</span>
        <h1>Bize yaz, pedala devam.</h1>
        <p>
          Aşağıdan konunu seç, mailin konusu hazır gelsin — genellikle birkaç gün içinde dönüş
          yapıyoruz.
        </p>

        <div className="contact-grid">
          {CHANNELS.map((c) => (
            <a
              key={c.title}
              className="contact-card"
              href={`mailto:${MAIL}?subject=${encodeURIComponent(c.subject)}`}
            >
              <span className="em" aria-hidden>{c.emoji}</span>
              <b>{c.title}</b>
              <p>{c.desc}</p>
            </a>
          ))}
        </div>

        <p>
          Ya da doğrudan yaz: <a href={`mailto:${MAIL}`} style={{ fontFamily: "var(--font-mono), monospace" }}>{MAIL}</a>
        </p>

        <p className="legal-note">
          Hesap silme talepleri için siteye kayıtlı e-posta adresinden yazman yeterlidir —
          verilerin makul süre içinde kalıcı olarak kaldırılır.
        </p>
      </div>
    </main>
  );
}
