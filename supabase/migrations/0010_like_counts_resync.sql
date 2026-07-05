-- 0010 — Beğeni/kayıt sayaçlarını gerçek satırlarla eşitle (tek seferlik bakım).
update public.routes r
  set likes_count = (select count(*) from public.route_likes l where l.route_id = r.id);
update public.routes r
  set saves_count = (select count(*) from public.route_saves s where s.route_id = r.id);
