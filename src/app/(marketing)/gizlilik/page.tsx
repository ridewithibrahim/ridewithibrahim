export const metadata = { title: "Gizlilik Politikası — RideWithIbrahim" };

export default function PrivacyPage() {
  return (
    <main className="legal">
      <div className="wrap">
        <span className="eyebrow">Gizlilik Politikası</span>
        <h1>Verilerin sende kalır, rotan bizde.</h1>
        <p className="legal-updated">Son güncelleme: Temmuz 2026</p>

        <h2>Hangi verileri topluyoruz?</h2>
        <p>
          Hesap oluştururken e-posta adresini, kullanıcı adını ve şifreni (şifrelenmiş olarak) saklarız.
          Platformu kullanırken paylaştığın rotalar, GPX dosyaları, fotoğraflar, yorumlar, beğeniler ve
          buluşma katılımların hesabınla ilişkilendirilir. Profiline eklediğin ad, şehir ve hakkında
          bilgileri isteğe bağlıdır.
        </p>

        <h2>Verilerini nasıl kullanıyoruz?</h2>
        <p>
          Verilerini yalnızca platformun çalışması için kullanırız: rotalarını haritada göstermek,
          topluluk etkileşimlerini (beğeni, yorum, katılım) yürütmek ve hesabını yönetmek.
          Verilerini üçüncü taraflara satmayız ve reklam amaçlı paylaşmayız.
        </p>

        <h2>Nerede saklanıyor?</h2>
        <p>
          Veriler Supabase altyapısında, harita görüntüleme Mapbox servisleriyle sağlanır. Oturumunun
          açık kalması için tarayıcında yalnızca kimlik doğrulama çerezleri kullanılır; reklam veya
          izleme çerezi kullanmayız.
        </p>

        <h2>Haklerin</h2>
        <p>
          Paylaştığın rotaları ve yorumları dilediğin zaman silebilirsin. Hesabının tamamen silinmesini
          istersen iletişim sayfasından bize ulaşman yeterli; verilerin makul süre içinde kalıcı olarak
          kaldırılır.
        </p>

        <p className="legal-note">
          Sorular için <a href="/iletisim">iletişim</a> sayfasını kullanabilirsin.
        </p>
      </div>
    </main>
  );
}
