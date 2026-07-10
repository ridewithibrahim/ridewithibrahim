import { getLang } from "@/lib/i18n-server";

export const metadata = { title: "İletişim / Contact — RideWithIbrahim" };

const MAIL = "mail@ridewithibrahim.com";

const CHANNELS = [
  {
    emoji: "💡",
    tr: { title: "Öneri & geri bildirim", desc: "Yeni özellik fikri mi var? Bir şey daha iyi olabilir mi? Dinliyoruz.", subject: "Öneri — RideWithIbrahim" },
    en: { title: "Ideas & feedback", desc: "Got a feature idea? Something could be better? We're listening.", subject: "Feedback — RideWithIbrahim" },
  },
  {
    emoji: "🐞",
    tr: { title: "Hata bildirimi", desc: "Çalışmayan bir şey mi gördün? Ekran görüntüsüyle yazarsan hızlıca düzeltiriz.", subject: "Hata bildirimi — RideWithIbrahim" },
    en: { title: "Bug report", desc: "Found something broken? Send a screenshot and we'll fix it quickly.", subject: "Bug report — RideWithIbrahim" },
  },
  {
    emoji: "🤝",
    tr: { title: "İşbirliği", desc: "Kulüp etkinlikleri, buluşma organizasyonları ve marka işbirlikleri için.", subject: "İşbirliği — RideWithIbrahim" },
    en: { title: "Partnerships", desc: "Club events, group ride organisations and brand collaborations.", subject: "Partnership — RideWithIbrahim" },
  },
];

export default async function ContactPage() {
  const lang = await getLang();
  const en = lang === "en";

  return (
    <main className="legal">
      <div className="wrap">
        <span className="eyebrow">{en ? "Contact" : "İletişim"}</span>
        <h1>{en ? "Drop us a line, keep pedalling." : "Bize yaz, pedala devam."}</h1>
        <p>
          {en
            ? "Pick a topic below and the email subject comes pre-filled — we usually reply within a few days."
            : "Aşağıdan konunu seç, mailin konusu hazır gelsin — genellikle birkaç gün içinde dönüş yapıyoruz."}
        </p>

        <div className="contact-grid">
          {CHANNELS.map((c) => {
            const v = en ? c.en : c.tr;
            return (
              <a
                key={v.title}
                className="contact-card"
                href={`mailto:${MAIL}?subject=${encodeURIComponent(v.subject)}`}
              >
                <span className="em" aria-hidden>{c.emoji}</span>
                <b>{v.title}</b>
                <p>{v.desc}</p>
              </a>
            );
          })}
        </div>

        <p>
          {en ? "Or write directly: " : "Ya da doğrudan yaz: "}
          <a href={`mailto:${MAIL}`} style={{ fontFamily: "var(--font-mono), monospace" }}>{MAIL}</a>
        </p>

        <p className="legal-note">
          {en
            ? "For account deletion requests, just email us from the address registered to your account — your data will be permanently removed within a reasonable time."
            : "Hesap silme talepleri için siteye kayıtlı e-posta adresinden yazman yeterlidir — verilerin makul süre içinde kalıcı olarak kaldırılır."}
        </p>
      </div>
    </main>
  );
}
