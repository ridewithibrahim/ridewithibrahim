-- ============================================================
-- 0005 — Tüm zamanlar liderlik view'ı
-- (weekly_leaderboard'un sınırsız hali; ayrıca toplam beğeni içerir)
-- SQL Editor'de çalıştır.
-- ============================================================

create or replace view public.alltime_leaderboard as
  select
    p.id, p.username, p.avatar_url,
    count(r.id) as route_count,
    coalesce(sum(r.distance_m), 0) as total_distance_m,
    coalesce(sum(r.likes_count), 0) as total_likes
  from public.profiles p
  join public.routes r on r.user_id = p.id
  group by p.id
  order by route_count desc, total_distance_m desc;
