import { getLang } from "@/lib/i18n-server";

export const metadata = { title: "Gizlilik Politikası / Privacy — RideWithIbrahim" };

export default async function PrivacyPage() {
  const lang = await getLang();

  if (lang === "en") {
    return (
      <main className="legal">
        <div className="wrap">
          <span className="eyebrow">Privacy Policy</span>
          <h1>Your data stays yours, your routes stay with us.</h1>
          <p className="legal-updated">Last updated: July 2026</p>

          <h2>What we collect</h2>
          <p>
            When you create an account we store your email address, username and password (encrypted).
            As you use the platform, the routes, GPX files, photos, comments, likes and meetup
            attendances you share are linked to your account. The name, city and bio on your profile
            are optional.
          </p>

          <h2>How we use it</h2>
          <p>
            We use your data only to run the platform: showing your routes on the map, powering
            community interactions (likes, comments, attendance) and managing your account. We never
            sell your data to third parties or share it for advertising.
          </p>

          <h2>Where it lives</h2>
          <p>
            Data is stored on Supabase infrastructure; maps are served by Mapbox. Your browser keeps
            only authentication cookies to stay signed in — we use no advertising or tracking cookies.
          </p>

          <h2>Your rights</h2>
          <p>
            You can delete the routes and comments you've shared at any time. If you'd like your
            account fully deleted, just reach out via the contact page and your data will be
            permanently removed within a reasonable time.
          </p>

          <p className="legal-note">
            Questions? Use the <a href="/iletisim">contact</a> page.
          </p>
        </div>
      </main>
    );
  }

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

        <h2>Hakların</h2>
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
