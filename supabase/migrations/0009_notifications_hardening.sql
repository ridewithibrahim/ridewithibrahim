-- ============================================================
-- 0009 — Bildirim tetikleyicilerine zırh:
-- Bildirim yazımı hata verse bile beğeni/yorum/katılım ASLA engellenmez.
-- SQL Editor'de çalıştır.
-- ============================================================

create or replace function public.notify_route_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  begin
    select user_id into owner from routes where id = new.route_id;
    if owner is not null and owner <> new.user_id then
      insert into notifications (user_id, actor_id, type, route_id)
      values (owner, new.user_id, 'like', new.route_id);
    end if;
  exception when others then
    null; -- bildirim düşmezse sessizce geç, beğeniyi engelleme
  end;
  return new;
end $$;

create or replace function public.notify_route_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner uuid;
begin
  begin
    select user_id into owner from routes where id = new.route_id;
    if owner is not null and owner <> new.user_id then
      insert into notifications (user_id, actor_id, type, route_id)
      values (owner, new.user_id, 'comment', new.route_id);
    end if;
  exception when others then
    null;
  end;
  return new;
end $$;

create or replace function public.notify_event_join()
returns trigger language plpgsql security definer set search_path = public as $$
declare host uuid;
begin
  begin
    select host_id into host from events where id = new.event_id;
    if host is not null and host <> new.user_id then
      insert into notifications (user_id, actor_id, type, event_id)
      values (host, new.user_id, 'join', new.event_id);
    end if;
  exception when others then
    null;
  end;
  return new;
end $$;
