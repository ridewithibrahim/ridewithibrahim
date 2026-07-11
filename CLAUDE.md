# RideWithIbrahim — Proje El Kitabı (CLAUDE.md)

## Proje nedir?
Bisiklet (yol/MTB), moto ve kamp rotalarının paylaşıldığı Türkçe topluluk platformu.
Rota paylaşımı (GPX **veya haritada çizerek**), harita keşfi, yakındaki rotalar, ⛺ kamp noktaları
katmanı, beğeni/kaydet/yorum, buluşmalar, liderlik, rütbe+rozetler, **bildirimler**, **birebir
mesajlaşma (engelle+şikâyet dahil)**, profiller. **Canlı: https://ridewithibrahim.com**
Tohum içerik: OSM'den 24 rota + ~500 kamp noktası (@arsiv); rotalarda uydu görüntülü otomatik
kapaklar. Durum: **LANSMAN** — teknik çekirdek tamam, odak topluluk büyütmede.

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
9. **ESKİ SİTE HAYALETLERİ:** Supabase projesi eski siteden devralındı. Yeni migration'larda
   `create table if not exists` eski-uyumsuz tabloya çarpıp sessizce zinciri kırabilir
   (notifications ve messages'ta yaşandı). Belirti: "column X does not exist". Çözüm deseni:
   kolonları information_schema'dan doğrula → uyumsuzsa `drop table ... cascade` → migration'ı
   baştan çalıştır.

## Veritabanı (Supabase — proje id: xpwathmahsrdglcoughe)
**Tablolar:** `profiles` (**is_admin** boolean dahil), `routes` (path geometry; likes/saves_count trigger'lı;
thumbnail_url), `route_likes`, `route_saves`, `route_comments` (uuid+content), `events`, `event_attendees`.
**View'lar:** `weekly_leaderboard`, `alltime_leaderboard`. **RPC:** `create_route`, `create_event`,
`routes_nearby` (UI'da kullanılmıyor; ölçek için rezerve).
**Storage:** `gpx`, `route-thumbnails` (avatarlar da `route-thumbnails/avatars/{uid}/` — üzerine yazma yok,
her seferinde yeni uuid dosya adı).
**Yeni tablolar:** `camp_spots` (0007: lat/lng düz kolon, PostGIS yok), `notifications` (0008:
like/comment/join tetikleyicili; 0009 ile exception-zırhlı — bildirim hatası ana eylemi asla
düşüremez), `conversations`+`messages`+`blocks`+`reports` (0011; `get_or_create_conversation`
RPC'si engel kontrollü; mesaj RLS'i iki yönlü engelde INSERT'i reddeder; reports'u yalnız admin okur).
**Migration'lar:** 0001–0011, hepsi çalıştırıldı (0006 admin, 0010 beğeni sayaç eşitleme bakımı).
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
- `(app)/liderlik`, `(app)/profil/[username]` (rütbe+rozetler; kendi profilinde Kaydettiklerim/
  Ayarlar, başkasında **💬 Mesaj gönder**; başlık mobilde alt satıra kırılır).
- `(app)/ayarlar`, `(app)/kaydedilenler`, `(app)/bildirimler` (❤️💬🤝 satırları, girişte okundu),
  `(app)/mesajlar` (gelen kutusu + engellediklerin), `/mesajlar/[id]` (baloncuklu sohbet, 5 sn
  tazeleme, Engelle iki aşamalı + Şikâyet formu → reports tablosu).
- Navbar (client): zarf + zil ikonları **canlı** okunmamış sayaçlı (sayfa geçişinde tarayıcıdan
  tazelenir; ilgili sayfaya girince söner). Rota kartlarındaki kalp tıklanabilir (CardLike,
  optimistic; enrich() liked/saved durumunu getirir).
- Harita: ⛺ Kamp noktaları çipi; "Kamp" tür filtresi seçilince katman otomatik açılır
  (elle açılan katman filtre değişince kapanmaz — autoCampsRef).
- Hero vitrin kartı: son 60 rotadan her yüklemede rastgele, tıklanabilir, zorluk renkli.
- Middleware korumalı: `/rotalar/yeni`, `/bulusmalar/yeni`, `/ayarlar`, `/kaydedilenler`,
  `/bildirimler`, `/mesajlar` (profiller HERKESE açık — listeye ekleme).
- PWA: manifest + amber bisiklet ikonları; service worker YOK (bilinçli — önbellek riskleri).

## SEO
- **Dinamik sitemap** (`app/sitemap.ts`): statik sayfalar + tüm rota ve buluşma sayfaları DB'den.
- Google Search Console bağlı, sitemap gönderildi (Başarılı). robots.ts mevcut.
- Rota/buluşma sayfalarında generateMetadata (başlık+açıklama+og:image = rota kapağı).
- Site geneli sosyal kart: `public/og-image.png` (1200×630, PIL ile üretildi) — layout'ta
  openGraph.images + twitter summary_large_image. Önizleme testleri: opengraph.xyz
  (mesajlaşma uygulamaları önbelleği inatçıdır).
- **İl SEO sayfaları:** /rotalar/il/[slug] (slugifyProvince ile; "Muğla bisiklet rotaları" tarzı
  aramaların hedefi). Sitemap'e otomatik girer; rota detayındaki il adı bu sayfaya link verir.
- **JSON-LD:** kök layout'ta WebSite+Organization (SiteJsonLd), rota detayında TouristTrip,
  buluşmada Event, il sayfasında BreadcrumbList.
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

**Diğer araçlar (scripts/):**
- `osm-camps.mjs` — kamp noktaları ithalatı (isim kara listesi + etiket-zenginliği puanıyla en iyi
  N'i seçer; --dry/--limit; tekrar çalıştırmadan önce `delete from camp_spots where source='osm'`).
- `rota-kapaklari.mjs` — @arsiv rotalarına Mapbox uydu görüntülü (rota çizgili) kapak üretir,
  storage'a yükler, thumbnail_url yazar (--dry/--force/--style dark; Referer header ile
  URL-kısıtlı token'ı geçer). Elle yüklenen fotoğraflar --force'suz korunur.
- Hikâye kartı (site içi 📸): rota fotoğrafı varsa onu cover-crop kullanır, yoksa statik harita.

## 🌍 i18n (çift dil: TR/EN)
Çerez tabanlı — URL'ler DEĞİŞMEZ, `[locale]` route refactor'u bilinçli olarak YAPILMADI (zip iş
akışında çok riskli). Mimari: `src/lib/i18n.ts` (STR sözlüğü ["tr","en"] çiftleri + `t(lang,key)` +
`diffName()`/`typeName()`; çerez adı rwi_lang) · `src/lib/i18n-server.ts` (`getLang()`: çerez > tarayıcı-dili-tr > ülke-TR > en; yabancı ziyaretçi otomatik İngilizce karşılanır) · `lang-switcher.tsx` (navbar'da TR|EN kapsülü, cookie + router.refresh) ·
`badges.ts`'te nameEn/labelEn/descEn + `rankName()`. Desen: server sayfa `getLang()` ile okur,
client bileşenlere `lang` prop geçirir (her yerde `lang = "tr"` varsayılanı — çevrilmemiş kullanım
kırılmaz). YENİ METİN EKLERKEN: sözlüğe çift ekle, `t()` ile kullan.
Fazlar: 2a çerçeve ✅ · 2b ana sayfa ✅ · 2c keşif (harita/rotalar/detay) ✅ · 2d sosyal katman
(profil+rozetler, bildirim, mesajlaşma, yorumlar, listeler, buluşma başlıkları) ✅ ·
2e formlar (rota paylaş/çiz/düzenle, buluşma aç, ayarlar, silme onayları) ✅ — SİTE %100 İKİ DİLLİ. Not: zod doğrulama mesajları TR kaldı (kabul edilen istisna); formlarda desen: bileşen içi `L(tr,en)` yardımcısı.
Ayrıca /en statik İngilizce tanıtım sayfası + hreflang mevcut.

## 🗺 Sürüş Modu (ride-tracker.tsx)
İki vites: **takip** (/surus/[id] — rota çizgisi + canlı mavi nokta, kalan km/%, sapma uyarısı,
bitişe <80m + %70 ilerlemede vurgulu 🏁 Bitir → route_completions upsert) ve **kayıt** (/kayit —
watchPosition izi ≥8m filtreli toplar, ⏹ Durdur → simplify(≤150 nokta) → sessionStorage
"rwi_recorded_track" → /rotalar/yeni?kayit=1; RouteForm mount'ta okuyup çizim moduna yükler).
Wake Lock ekranı uyanık tutar (visibilitychange'de yeniden alınır). Web sınırı: ekran açık kalmalı;
arka plan kaydı YOK (bilinçli). Giriş: rota detayı "▶ Sürüşü başlat" (.btn-ride), rotalar sayfası
"⏺ Rota kaydet". Faz 2 ✅: ⏸ duraklat/▶ devam (süre birikimli; kayıtta iz MultiLineString segmentli — molada
yer değişse ışınlanma çizgisi oluşmaz, yayında flatten edilir), canlı hız (coords.speed yoksa
noktalardan, 0.6/0.4 yumuşatma, >90 km/s sıçrama filtreli), 🎯 sapma hassasiyeti çipi
(Hassas 40m / Normal 80m / Rahat 150m), GPS doğruluk filtresi (accuracy>40m atılır).

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
✅ Bitti: yakındaki rotalar, haritada çizme, kamp noktaları katmanı, Analytics, paylaşım+OG+hikâye
kartı, içerik yönetimi, kaydedilenler, arama, rütbe+rozetler, moderasyon, **bildirimler**,
**mesajlaşma (engelle+şikâyet)**, OSM tohumu (24 rota + 500 kamp), uydu kapaklar, dinamik
sitemap+GSC, tanıtım metinleri.
**Şu anki faz: LANSMAN** — tanıtım gönderileri, ilk gerçek kullanıcılar; gösterge: Analytics +
Supabase'de yabancı kayıt/rota + reports tablosu kontrolü.
Sıradaki adaylar (VERİYLE seçilecek): aynı kişiler rota paylaşıyorsa → takip sistemi; kamp katmanı
tutuyorsa → kamp Faz 2 (kullanıcı nokta ekleme + detay sayfaları + filtreler); mesajlaşma yoğunsa →
Realtime'a geçiş. Park: i18n + dünya rotaları (tetik: anlamlı yabancı trafik), routes_nearby RPC'ye
geçiş (binlerce rotada).
