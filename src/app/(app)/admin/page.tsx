import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Denetim — RideWithIbrahim" };

// Yalnız admin görür: içerik akışını tek ekrandan denetleme masası.
export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: me } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle<{ is_admin: boolean }>();
  if (!me?.is_admin) redirect("/");

  const [
    { count: userCount },
    { count: routeCount },
    { count: commentCount },
    { count: compCount },
    { count: reportCount },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("routes").select("id", { count: "exact", head: true }),
    supabase.from("comments").select("id", { count: "exact", head: true }),
    supabase.from("route_completions").select("id", { count: "exact", head: true }),
    supabase.from("reports").select("id", { count: "exact", head: true }),
  ]);

  const [{ data: reports }, { data: members }, { data: routes }, { data: comments }, { data: comps }] =
    await Promise.all([
      supabase
        .from("reports")
        .select("id, reporter_id, reported_id, reason, detail, created_at")
        .order("created_at", { ascending: false })
        .limit(10)
        .returns<{ id: string; reporter_id: string; reported_id: string; reason: string; detail: string | null; created_at: string }[]>(),
      supabase
        .from("profiles")
        .select("id, username, created_at")
        .order("created_at", { ascending: false })
        .limit(8)
        .returns<{ id: string; username: string; created_at: string }[]>(),
      supabase
        .from("routes")
        .select("id, title, province, user_id, created_at")
        .order("created_at", { ascending: false })
        .limit(8)
        .returns<{ id: string; title: string; province: string; user_id: string; created_at: string }[]>(),
      supabase
        .from("comments")
        .select("id, route_id, user_id, content, created_at")
        .order("created_at", { ascending: false })
        .limit(8)
        .returns<{ id: string; route_id: string; user_id: string; content: string; created_at: string }[]>(),
      supabase
        .from("route_completions")
        .select("user_id, route_id, completed_at")
        .order("completed_at", { ascending: false })
        .limit(8)
        .returns<{ user_id: string; route_id: string; completed_at: string }[]>(),
    ]);

  // kullanıcı adları + rota başlıkları (join yasak — Map ile zenginleştir)
  const userIds = new Set<string>();
  (reports ?? []).forEach((r) => { userIds.add(r.reporter_id); userIds.add(r.reported_id); });
  (routes ?? []).forEach((r) => userIds.add(r.user_id));
  (comments ?? []).forEach((c) => userIds.add(c.user_id));
  (comps ?? []).forEach((c) => userIds.add(c.user_id));
  const routeIds = new Set<string>();
  (comments ?? []).forEach((c) => routeIds.add(c.route_id));
  (comps ?? []).forEach((c) => routeIds.add(c.route_id));

  const [{ data: nameRows }, { data: titleRows }] = await Promise.all([
    userIds.size
      ? supabase.from("profiles").select("id, username").in("id", [...userIds]).returns<{ id: string; username: string }[]>()
      : Promise.resolve({ data: [] as { id: string; username: string }[] }),
    routeIds.size
      ? supabase.from("routes").select("id, title").in("id", [...routeIds]).returns<{ id: string; title: string }[]>()
      : Promise.resolve({ data: [] as { id: string; title: string }[] }),
  ]);
  const names = new Map((nameRows ?? []).map((p) => [p.id, p.username]));
  const titles = new Map((titleRows ?? []).map((r) => [r.id, r.title]));
  const dt = (iso: string) =>
    new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <main className="sec" style={{ paddingTop: 40 }}>
      <div className="wrap">
        <div className="sec-head">
          <div>
            <span className="eyebrow">Denetim masası</span>
            <h2>Kule, konuş 🎛</h2>
          </div>
        </div>

        <div className="adm-stats">
          <div><b>{userCount ?? 0}</b><span>Üye</span></div>
          <div><b>{routeCount ?? 0}</b><span>Rota</span></div>
          <div><b>{commentCount ?? 0}</b><span>Yorum</span></div>
          <div><b>{compCount ?? 0}</b><span>Tamamlama</span></div>
          <div className={reportCount ? "adm-alert" : ""}><b>{reportCount ?? 0}</b><span>Şikâyet</span></div>
        </div>

        <section className="adm-sec">
          <h3>🚨 Şikâyetler</h3>
          {(reports ?? []).length === 0 ? (
            <p className="adm-empty">Şikâyet yok — sular durgun.</p>
          ) : (
            (reports ?? []).map((r) => (
              <div className="adm-row adm-report" key={r.id}>
                <span>
                  <Link href={`/profil/${names.get(r.reporter_id) ?? ""}`}>@{names.get(r.reporter_id) ?? "?"}</Link>
                  {" → "}
                  <Link href={`/profil/${names.get(r.reported_id) ?? ""}`}>@{names.get(r.reported_id) ?? "?"}</Link>
                  {" · "}<b>{r.reason}</b>
                  {r.detail && <em> — {r.detail}</em>}
                </span>
                <time>{dt(r.created_at)}</time>
              </div>
            ))
          )}
        </section>

        <div className="adm-grid">
          <section className="adm-sec">
            <h3>👤 Son üyeler</h3>
            {(members ?? []).map((m) => (
              <div className="adm-row" key={m.id}>
                <Link href={`/profil/${m.username}`}>@{m.username}</Link>
                <time>{dt(m.created_at)}</time>
              </div>
            ))}
          </section>

          <section className="adm-sec">
            <h3>🗺 Son rotalar</h3>
            {(routes ?? []).map((r) => (
              <div className="adm-row" key={r.id}>
                <span>
                  <Link href={`/rotalar/${r.id}`}>{r.title}</Link>
                  <em> · {r.province} · @{names.get(r.user_id) ?? "?"}</em>
                </span>
                <time>{dt(r.created_at)}</time>
              </div>
            ))}
          </section>

          <section className="adm-sec">
            <h3>💬 Son yorumlar</h3>
            {(comments ?? []).map((c) => (
              <div className="adm-row" key={c.id}>
                <span>
                  <b>@{names.get(c.user_id) ?? "?"}</b>{" "}
                  <Link href={`/rotalar/${c.route_id}`}>{titles.get(c.route_id) ?? "rota"}</Link>
                  <em> — {c.content.slice(0, 80)}{c.content.length > 80 ? "…" : ""}</em>
                </span>
                <time>{dt(c.created_at)}</time>
              </div>
            ))}
          </section>

          <section className="adm-sec">
            <h3>🏁 Son tamamlamalar</h3>
            {(comps ?? []).map((c, i) => (
              <div className="adm-row" key={i}>
                <span>
                  <b>@{names.get(c.user_id) ?? "?"}</b>{" "}
                  <Link href={`/rotalar/${c.route_id}`}>{titles.get(c.route_id) ?? "rota"}</Link>
                </span>
                <time>{dt(c.completed_at)}</time>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}
