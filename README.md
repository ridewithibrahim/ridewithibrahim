# RideWithIbrahim

Bisiklet (yol/MTB), moto, kamp ve keşif için topluluk rotası ve buluşma platformu.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind v4 + shadcn/ui · Supabase (Auth/DB/Storage/Realtime) · Mapbox GL JS · Zod + React Hook Form.

## Kurulum

```bash
# 1) Projeyi oluştururken (ilk kez) — Tailwind v4 + src dir + App Router
pnpm create next-app@latest ridewithibrahim --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

# 2) Bağımlılıklar
pnpm add @supabase/supabase-js @supabase/ssr mapbox-gl zod react-hook-form @hookform/resolvers
pnpm add -D @types/mapbox-gl
pnpm dlx shadcn@latest init          # form, dialog, button, input, sonner ...

# 3) Bu repodaki src/ ve supabase/ dosyalarını yerine koy
# 4) Ortam değişkenleri
cp .env.local.example .env.local     # URL, anon key, mapbox token doldur

# 5) Veritabanı — supabase/migrations/0001_init.sql'i SQL editöründe çalıştır
#    (veya: supabase db push). PostGIS + tablolar + RLS + leaderboard + RPC kurulur.

# 6) Tipleri üret
pnpm dlx supabase gen types typescript --project-id <ID> > src/types/database.types.ts

pnpm dev
```

Supabase → Authentication → Providers: **Email** açık, Google kapalı.
Email confirmation açıksa onay linki `/auth/confirm` route'una gelir.

## Klasör yapısı

```
src/
├─ middleware.ts                 # session refresh + korumalı route guard
├─ app/
│  ├─ layout.tsx                 # next/font + mapbox css + globals
│  ├─ globals.css                # tasarım tokenları + tüm bileşen stilleri
│  ├─ (marketing)/
│  │  ├─ layout.tsx              # Navbar (auth-aware) + Footer + ScrollReveal
│  │  └─ page.tsx                # ANA SAYFA
│  ├─ (auth)/
│  │  ├─ layout.tsx  actions.ts  auth-form.tsx
│  │  ├─ login/page.tsx  signup/page.tsx
│  └─ auth/confirm/route.ts      # email onay token exchange
├─ components/
│  ├─ home/  navbar hero featured-routes route-card map-preview
│  │         upcoming-events cta/footer icons
│  └─ shared/reveal.tsx
├─ lib/
│  ├─ supabase/ client.ts server.ts middleware.ts
│  ├─ types.ts  queries.ts  mock.ts
└─ types/database.types.ts
supabase/migrations/0001_init.sql
```

## Sıradaki adımlar
- `/harita` tam ekran Mapbox + filtre + `routes_nearby` RPC
- `/rotalar/yeni` — RHF + Zod form, GPX/KML parse → `geometry(LineString)`
- `/rotalar/[id]` — beğeni/kaydet/yorum (Realtime), elevation profil
- `/bulusmalar` ve `/liderlik` (weekly_leaderboard view)
