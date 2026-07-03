export const metadata = { title: "İletişim — RideWithIbrahim" };

export default function ContactPage() {
  return (
    <main className="legal">
      <div className="wrap">
        <span className="eyebrow">İletişim</span>
        <h1>Bize yaz, pedala devam.</h1>
        <p>
          Soru, öneri, hata bildirimi ya da işbirliği için e-posta gönderebilirsin. Genellikle birkaç
          gün içinde dönüş yapıyoruz.
        </p>
        <a className="btn btn-primary" href="mailto:info@ridewithibrahim.com" style={{ marginTop: 8 }}>
          info@ridewithibrahim.com
        </a>
        <p className="legal-note" style={{ marginTop: 28 }}>
          Hesap silme talepleri için kayıtlı e-posta adresinden yazman yeterlidir.
        </p>
      </div>
    </main>
  );
}
