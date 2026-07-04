# RideWithIbrahim — Proje El Kitabı (CLAUDE.md)

## Proje nedir?
Bisiklet (yol/MTB), moto ve kamp rotalarının paylaşıldığı Türkçe topluluk platformu.
Rota paylaşımı (GPX **veya haritada çizerek**), harita keşfi, yakındaki rotalar, beğeni/kaydet/yorum,
buluşmalar, liderlik, rütbe+rozet sistemi, profiller. **Canlı: https://ridewithibrahim.com**
Site, OSM'den aktarılan 24 rotayla tohumlandı (@arsiv profili). Durum: **lansman aşaması** —
teknik çekirdek tamam, odak topluluk büyütmede.

## Kullanıcı hakkında (önemli)
- Proje sahibi İbrahim; kodlama bilgisi azdır, her şeyi AI ile yapar.
- **Türkçe konuş.** Teknik terimleri sade açıkla, adımları tek tek ver.
- Değişiklik sonrası rutini her zaman hatırlat: `npm run build` yeşil → git push → Vercel otomatik.
- İletişim: mail@ridewithibrahim.com (Google Workspace).

## Stack
- **Next.js 15 (App Router) + TypeScript**, Tailwind v4 (stiller tek dosyada: globals.css, sona eklenerek büyür)
- **Supabase**: Auth (yalnız email/şifre, e-posta onayı KAPALI), PostgreSQL + PostGIS, Storage
- **Mapbox GL JS v3** (dark-v11) · Zod + React Hook Form · **Vercel** (GitHub push → otomatik deploy)
- @vercel/analytics kurulu (layout'ta `<Analytics />`), Vercel panelinde aktif.

## ⚠️ KRİTİK KOD KURALLARI (acıyla öğrenildi — asla ihlal etme)
1. **Supabase client'ları `Database` generic'i KULLANMAZ.** `src/lib/supabase/{client,server,middleware}.ts`
   bilinçli tipsizdir; üretilen tip dosyası kütüphaneyle uyuşmayıp her yerde `never` üretiyordu. Generic GERİ EKLEME.
2. **Tüm SELECT'ler açık tip taşır:** `.returns<T[]>()`, `.maybeSingle<T>()` veya `data as T[]`.
3. **Tüm mutasyonlar payload'ı `as never` ile cast eder:** insert/upsert/update ve RPC argümanları.
4. **PostgREST join (embed) YASAK.** Desen: satırları çek → user_id'lerle profilleri ayrı sorguda çek →
   Map ile eşle (`queries.ts` → `enrich()` örnek).
5. **`@types/mapbox-gl` paketini ASLA kurma** (v3 kendi tiplerini taşır). Modül tipi gerekirse:
   `import type mapboxglType from "mapbox-gl"`.
6. **Mapbox'a renk = HEX** (CSS var çalışmaz). Zorluk renkleri lib/types.ts DIFFICULTY'de:
   kolay #54B97C, orta #5BA3D0, zor #E2823F, uzman #D45D49.
7. **RPC'lere `null` gönderme:** boş metin `""`, opsiyonel sayı `undefined` (SQL nullif halleder).
8. **Problems paneli güvenilmez; tek hakem `npm run build`.** VS Code tip sürümü: Workspace Version.

## Veritabanı (Supabase — proje id: xpwathmahsrdglcoughe)
**Tablolar:** `profiles` (**is_admin** boolean dahil), `routes` (path geometry; likes/saves_count trigger'lı;
thumbnail_url), `route_likes`, `route_saves`, `route_comments` (uuid+content), `events`, `event_attendees`.
**View'lar:** `weekly_leaderboard`, `alltime_leaderboard`. **RPC:** `create_route`, `create_event`,
`routes_nearby` (UI'da kullanılmıyor; ölçek için rezerve).
**Storage:** `gpx`, `route-thumbnails` (avatarlar da `route-thumbnails/avatars/{uid}/` — üzerine yazma yok,
her seferinde yeni uuid dosya adı).
**Migration'lar:** 0001–0006, hepsi çalıştırıldı (0006 = is_admin + "admin delete any ..." politikaları,
mevcut sahip politikalarına EK olarak — permissive policy'ler OR'lanır).
RLS her yerde aktif; signup anında oturum açar.

## Moderasyon
İbrahim'in hesabında `profiles.is_admin = true`. Admin, sitede **her** rotada/yorumda/buluşmada silme
butonunu görür (Düzenle sahibe özel kalır). Yetkinin aslı RLS'te; UI sadece buton gösterir.
Yeni moderatör: `update profiles set is_admin = true where username = '...';`

## Rütbe & Rozetler (src/lib/badges.ts — DB'siz, anlık hesaplanır)
Rütbeler (rota sayısı VEYA toplam km ile): 🌱 Çaylak → 🧭 Kaşif (1/30) → 🚴 Yol Arkadaşı (3/100) →
🔥 Rotacı (7/300) → ⚡ Kilometre Avcısı (15/750) → 🏆 Efsane (30/2000). Profilde rank-chip + kendi
profilinde "sıradaki rütbeye ... kaldı" teşviki. Rozetler (8 adet, kilitliler soluk): İlk Rota, Haritacı(5),
Koleksiyoncu(15), 100/500 km Kulübü, Tırmanışçı(tek rotada 1000m+), Sevilen(10+ beğeni), Çok Yönlü(3 tür).

## Sayfa haritası (src/app)
- `(marketing)/` ana sayfa: Hero gerçek istatistikler, CTA bandı **üyelik durumuna göre** değişir
  (misafir: Ücretsiz katıl / üye: Rota paylaş). + gizlilik, sartlar, iletisim (konu kartlı mailto).
- `(app)/harita` MapExplorer: filtreler + **📍 Konumum** (yakından uzağa sıralama + "≈ x km uzakta") +
  satır ve popup'ta navigasyon/detay butonları.
- `(app)/rotalar` liste: anlık **arama** (rota adı + il + @kullanıcı) + filtreler.
- `/rotalar/[id]` detay: fotoğraf banner, harita, irtifa grafiği, **Google navigasyon**, **Paylaş**
  (Web Share / kopyala), GPX indir, sahibine Düzenle+Sil (admine Sil), beğeni/kaydet, yorumlar (sahibi/admin ✕),
  **generateMetadata** ile zengin link önizlemesi (OG).
- `/rotalar/[id]/duzenle`: sahibe özel — başlık/tür/zorluk/il/fotoğraf/açıklama (parkur değişmez).
- `/rotalar/yeni`: iki mod — **GPX yükle** veya **🖊 Haritada çiz** (tıkla-çiz, Konumum, mesafe canlı,
  süre türe göre tahmin, tırmanış opsiyonel manuel) + fotoğraf.
- `(app)/bulusmalar` (+[id]: katıl, **Paylaş**, hosta/admine **iptal**, OG metadata; +yeni).
- `(app)/liderlik`, `(app)/profil/[username]` (rütbe+rozetler+Kaydettiklerim/Ayarlar butonları),
  `(app)/ayarlar`, `(app)/kaydedilenler` (kaydedilen rotalar, kayıt sırasıyla).
- Middleware korumalı: `/rotalar/yeni`, `/bulusmalar/yeni`, `/ayarlar`, `/kaydedilenler`
  (profiller HERKESE açık — listeye ekleme).
- PWA: manifest + amber bisiklet ikonları; service worker YOK (bilinçli — önbellek riskleri).

## SEO
- **Dinamik sitemap** (`app/sitemap.ts`): statik sayfalar + tüm rota ve buluşma sayfaları DB'den.
- Google Search Console bağlı, sitemap gönderildi (Başarılı). robots.ts mevcut.
- Rota/buluşma sayfalarında generateMetadata (başlık+açıklama+og:image).
- next.config.ts: eski site yönlendirmeleri `/terms→/sartlar`, `/privacy→/gizlilik`, `/contact→/iletisim`.
- GSC "dizine eklenmedi" kayıtları çoğunlukla bilgidir; hakem: dizinlenen sayfa sayısı + Performans.

## OSM İçe Aktarma Aracı (scripts/osm-import.mjs)
Overpass'tan isimli bisiklet/MTB rotalarını çeker, parça birleştirir (%70 bütünlük şartı), 15-250 km
(MTB 8+), irtifadan zorluğu otomatik atar, ili Nominatim'le bulur (TR noktası öncelikli), OSM/ODbL
atıf notuyla `create_route`'a yükler. Kullanım: `--dry` (listele), `--limit N`, `--mtb` (sadece MTB).
Gereksinim: `.env.local` içinde ARSIV_EMAIL/ARSIV_PASSWORD (@arsiv hesabı) + @supabase/supabase-js.
NOT: DB'ye karşı tekrar-kontrolü yok — aynı bölgeyi ikinci kez çalıştırma (kopya üretir).
Dünyaya açılım = sorgudaki `area["ISO3166-1"="TR"]` satırını değiştirmek. OSM TR'de MTB ilişkisi YOK
(test edildi) — MTB kategorisi topluluk dolduracak.

## Tasarım kimliği
Zemin #0C1512, amber #F2B14C, spruce #5FB8A3. Fontlar: Archivo / Hanken Grotesk / Space Mono.
Kart dili: küçük kare ikon butonlar, pill chip'ler, ince --line kenarlıklar; tehlikeli eylemler sessiz
(ince kırmızı çerçeve) + iki aşamalı onay. Görsel değişimde mevcut dile sadık kal.

## Altyapı
- Domain GoDaddy'de kayıtlı, **DNS Netlify'da** (A @→76.76.21.21, CNAME www→cname.vercel-dns.com).
  **MX(5, Google)+3 TXT'ye ASLA dokunma** (mail@ oradan çalışır). GSC doğrulaması da TXT ile.
- Mapbox prod token URL kısıtlamalı. Supabase Site URL = https://ridewithibrahim.com (+ redirect'ler).
- Env: NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY / _MAPBOX_TOKEN (+lokalde ARSIV_*). Env değişince Redeploy şart.

## Yol haritası
✅ Bitti: yakındaki rotalar, haritada çizme, Analytics, paylaşım+OG, içerik yönetimi (sil/düzenle),
kaydedilenler, arama, rütbe+rozetler, moderasyon, OSM tohumu (24 rota), dinamik sitemap+GSC, davet metinleri.
**Şu anki faz: LANSMAN** — davetler, ilk gerçek kullanıcılar, Analytics/Supabase izleme.
Sıradaki adaylar (veri gelince): takip sistemi → bildirimler → mesajlaşma. Park: i18n/İngilizce +
dünya rotaları (tetik: anlamlı yabancı trafik/kayıt), "Keşif" türü, routes_nearby'a geçiş (binlerce rotada).
