# RideWithIbrahim — Deploy Rehberi (Vercel)

## 0) Deploy ÖNCESİ — zorunlu adımlar

### a. Eski dosyaları sil (artık kullanılmıyor)
- `src/components/routes/route-filters.tsx`
- `src/lib/mock.ts`

### b. Migration'ların hepsi çalıştı mı?
Supabase SQL Editor'de sırasıyla çalışmış olmalı:
`0001_init` (veya clean sürümü) → `0002_create_route` → `0003_route_comments` → `0004_create_event` → `0005_alltime_leaderboard`.

### c. ⚠️ EN KRİTİK: TypeScript tiplerini YENİDEN üret
Tip dosyan `create_event` RPC'si ve `alltime_leaderboard` view'ından ÖNCE üretildi.
`npm run dev` bunu umursamaz ama **Vercel build tam tip denetimi yapar ve PATLAR.**

PowerShell (proje kökünde):
```powershell
npx supabase gen types typescript --project-id xpwathmahsrdglcoughe | Out-File -Encoding utf8 src/types/database.types.ts
```
(Windows'ta `>` yerine mutlaka `| Out-File -Encoding utf8` kullan.)

### d. Build'i LOKALDE test et
```powershell
npm run build
```
Hatasız biterse Vercel'de de biter. Hata çıkarsa dosya/satır söyler — deploy'dan önce burada çöz.

## 1) GitHub'a yükle
1. github.com → New repository → `ridewithibrahim` (public/private fark etmez).
2. Proje kökünde:
```powershell
git init
git add .
git commit -m "RideWithIbrahim v1"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADIN/ridewithibrahim.git
git push -u origin main
```
Not: `.env.local` `.gitignore`'da — GitHub'a gitmez, gitmemeli.

## 2) Vercel
1. vercel.com → GitHub ile giriş → **Add New → Project** → repoyu seç.
2. Framework: Next.js (otomatik algılar). Ayarları değiştirme.
3. **Environment Variables** — üçünü de ekle (Production + Preview):
```
NEXT_PUBLIC_SUPABASE_URL      = https://xpwathmahsrdglcoughe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = sb_publishable_...   (anon/publishable key'in)
NEXT_PUBLIC_MAPBOX_TOKEN      = pk...                (mapbox token'ın)
```
4. **Deploy** → 1-2 dk → `https://ridewithibrahim.vercel.app` canlı.

## 3) Deploy SONRASI ayarlar

### Supabase — Auth URL'leri
Authentication → URL Configuration:
- **Site URL**: `https://ridewithibrahim.vercel.app` (domain bağlayınca güncelle)
- **Redirect URLs**: `https://ridewithibrahim.vercel.app/**` ekle (localhost'u da bırak).

### Mapbox — token kısıtlaması (önemli)
account.mapbox.com → token → **URL restrictions**:
`http://localhost:3000` ve `https://ridewithibrahim.vercel.app` (+ kendi domainin).
Böylece token'ını başka site kullanamaz.

### Kendi domainin (opsiyonel)
Vercel → Project → Settings → Domains → `ridewithibrahim.com` ekle → verilen DNS kayıtlarını domain sağlayıcında gir.

## 4) Canlıda duman testi
- [ ] Ana sayfa: hero istatistikleri gerçek sayılar, rotalar/buluşmalar geliyor
- [ ] `/harita`: harita + rotalar + filtreler
- [ ] Kayıt ol → hoş geldin bildirimi → sağ üstte @kullanıcı
- [ ] `/rotalar/yeni`: GPX yükle → yayınla → haritada gör
- [ ] Rota detay: beğeni, kaydet, yorum
- [ ] `/bulusmalar`: oluştur + katıl
- [ ] `/liderlik`: iki sekme
- [ ] Telefondan aç: menü, kartlar, harita

## 5) Sık hatalar → çözüm
| Belirti | Sebep | Çözüm |
|---|---|---|
| Vercel build "type error" | Tipler eski | Adım 0c: tipleri yeniden üret, push |
| Harita gri/boş | Token env eksik ya da URL kısıtı yanlış | Vercel env + Mapbox restrictions kontrol |
| Login sonrası dönmüyor / auth kopuk | Supabase Site URL yanlış | Adım 3'teki URL ayarları |
| Veri gelmiyor ama site açık | Env değişkeni Production'a eklenmemiş | Vercel → Settings → Env Vars → Redeploy |
| Değişiklik siteye yansımıyor | Push sonrası otomatik deploy bekle | Vercel dashboard'dan Deployments kontrol |

## Güvenlik durumu (özet)
- RLS tüm tablolarda aktif; yazma işlemleri `auth.uid()` şartına bağlı.
- `anon` (publishable) key tarayıcıda olması için tasarlandı — güvenlik RLS'ten gelir. ✅
- `service_role` hiçbir yerde kullanılmıyor. ✅
- Sunucu tarafında auth her yerde `getUser()` ile doğrulanıyor (getSession değil). ✅
- Storage: herkese okuma, sadece giriş yapana yükleme, sadece sahibine silme. ✅
