import { getLang } from "@/lib/i18n-server";

export const metadata = { title: "Kullanım Şartları / Terms — RideWithIbrahim" };

export default async function TermsPage() {
  const lang = await getLang();

  if (lang === "en") {
    return (
      <main className="legal">
        <div className="wrap">
          <span className="eyebrow">Terms of Use</span>
          <h1>Short rules, long roads.</h1>
          <p className="legal-updated">Last updated: July 2026</p>

          <h2>The service</h2>
          <p>
            RideWithIbrahim is a platform for sharing cycling, moto, camping and exploring routes and
            for organising community meetups. By using the service you accept these terms.
          </p>

          <h2>Content & responsibility</h2>
          <p>
            The routes, photos and comments you share belong to you, and you are responsible for
            them. Content that violates others&apos; rights, is misleading or gives dangerous
            directions may be removed. Routes are community contributions; their accuracy and safety
            are not guaranteed.
          </p>

          <h2>Safety notice</h2>
          <p>
            Riding, camping and outdoor activities carry inherent risk. Before following a route,
            assess the weather, road and surface conditions yourself; wear a helmet and protective
            gear. RideWithIbrahim cannot be held liable for losses arising from information on the
            platform.
          </p>

          <h2>Your account</h2>
          <p>
            You are responsible for the security of your account. Accounts may be suspended for use
            that breaks the rules. These terms may be updated from time to time; significant changes
            will be announced on this page.
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
        <span className="eyebrow">Kullanım Şartları</span>
        <h1>Kurallar kısa, yol uzun.</h1>
        <p className="legal-updated">Son güncelleme: Temmuz 2026</p>

        <h2>Hizmet</h2>
        <p>
          RideWithIbrahim; bisiklet, moto, kamp ve keşif rotalarının paylaşıldığı, topluluk
          buluşmalarının düzenlendiği bir platformdur. Hizmeti kullanarak bu şartları kabul etmiş
          olursun.
        </p>

        <h2>İçerik ve sorumluluk</h2>
        <p>
          Paylaştığın rotalar, fotoğraflar ve yorumlar sana aittir ve bunlardan sen sorumlusun.
          Başkalarının haklarını ihlal eden, yanıltıcı veya tehlikeli yönlendirme içeren içerikler
          kaldırılabilir. Rotalar topluluk katkısıdır; güncelliği ve güvenliği garanti edilmez.
        </p>

        <h2>Güvenlik uyarısı</h2>
        <p>
          Sürüş, kamp ve doğa aktiviteleri doğası gereği risk içerir. Bir rotayı takip etmeden önce
          hava, yol ve zemin koşullarını kendin değerlendir; kask ve koruyucu ekipman kullan.
          Platformdaki bilgiler nedeniyle oluşabilecek kayıplardan RideWithIbrahim sorumlu tutulamaz.
        </p>

        <h2>Hesap</h2>
        <p>
          Hesabının güvenliğinden sen sorumlusun. Kurallara aykırı kullanım durumunda hesap askıya
          alınabilir. Şartlar zaman zaman güncellenebilir; önemli değişiklikler bu sayfada duyurulur.
        </p>

        <p className="legal-note">
          Sorular için <a href="/iletisim">iletişim</a> sayfasını kullanabilirsin.
        </p>
      </div>
    </main>
  );
}
